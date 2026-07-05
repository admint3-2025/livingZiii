import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Agent } from 'undici';
import {
  AccessControlProvider,
  AccessControlProviderConfig,
  AccessEvent,
  AccessEventType,
  VisitorPass,
  VisitorPassRequest,
} from './access-control.types';

type DigestChallenge = Record<string, string>;

interface HikvisionProviderState {
  config?: AccessControlProviderConfig;
  deviceInfo?: Record<string, string>;
  capabilities?: Record<string, any>;
  teamSession?: {
    accessToken: string;
    areaDomain?: string;
    expireTime?: number;
  };
}

interface TemporaryPassSnapshot {
  passId: string;
  visitorName?: string;
  visitorEmail?: string;
  validFrom?: string;
  validUntil?: string;
  status?: string;
  qrCode?: string;
  maxEntries?: number;
}

@Injectable()
export class HikvisionAccessControlProvider implements AccessControlProvider {
  id = 'hikvision';
  name = 'Hikvision Access Control';

  private state: HikvisionProviderState = {};

  async validateCredentials(config: AccessControlProviderConfig): Promise<boolean> {
    this.state.config = this.mergeWithEnvDefaults(config);
    const deviceInfo = await this.requestXml('/ISAPI/System/deviceInfo');
    this.state.deviceInfo = deviceInfo;
    return Boolean(deviceInfo.model || deviceInfo.deviceName);
  }

  async createVisitorPass(request: VisitorPassRequest): Promise<VisitorPass> {
    const config = this.requireConfig();

    if (config.integrationMode === 'team') {
      return this.createVisitorPassViaTeamMode(request, config);
    }

    const id = cryptoRandomId();
    const qrCode = this.buildNativeQrPlaceholder(request, id);

    return {
      id,
      qrCode,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      status: 'active',
      createdAt: new Date(),
    };
  }

  async revokePass(passId: string): Promise<void> {
    const config = this.requireConfig();
    if (config.integrationMode === 'team' && config.visitorRevokeEndpoint) {
      const response = await this.callTeamModeEndpoint(
        config.visitorRevokeEndpoint,
        this.buildTemporaryPassDeletePayload(passId),
        config,
      );
      this.assertTeamModeSuccess(response);
      return;
    }

    void passId;
  }

  async listTemporaryPassIds(): Promise<Set<string>> {
    const snapshots = await this.listTemporaryPasses();
    return new Set(snapshots.map((snapshot) => snapshot.passId));
  }

  async listTemporaryPasses(): Promise<TemporaryPassSnapshot[]> {
    const config = this.requireConfig();
    if (config.integrationMode !== 'team' || !config.visitorListEndpoint) {
      return [];
    }

    const response = await this.callTeamModeEndpoint(
      config.visitorListEndpoint,
      {
        pageNum: 1,
        pageSize: 500,
        searchRequest: {
          filter: {
            name: '',
          },
        },
      },
      config,
    );
    this.assertTeamModeSuccess(response);

    return collectTemporaryPassSnapshots(response);
  }

  async temporaryPassExists(passId: string): Promise<boolean> {
    const config = this.requireConfig();
    if (config.integrationMode !== 'team') {
      return true;
    }

    const endpoint = config.visitorGetEndpoint ?? this.inferTeamModeGetEndpoint(config);
    try {
      const response = await this.callTeamModeEndpoint(endpoint, this.buildTemporaryPassIdPayload(passId), config);
      this.assertTeamModeSuccess(response);
      const data = this.unwrapTeamModeData(response);

      return Boolean(data?.id ?? data?.accessControlPassId ?? data?.passId ?? data?.qrCode ?? data?.qrContent);
    } catch (error) {
      if (error instanceof Error && /not\s*found|not\s*exist|no\s*data|不存在|deleted|invalid/i.test(error.message)) {
        return false;
      }

      throw error;
    }
  }

  async syncAccessEvents(_since: Date, _limit = 100): Promise<AccessEvent[]> {
    // The device exposes access-control capabilities, but the exact event collection endpoint still needs
    // model/firmware-specific confirmation before we hard-code it.
    return [];
  }

  async getAccessEvent(eventId: string): Promise<AccessEvent | null> {
    void eventId;
    return null;
  }

  async listAccessPoints(): Promise<Array<{ id: string; name: string; location?: string }>> {
    const deviceInfo = await this.getDeviceInfo();
    const id = deviceInfo.deviceID ?? deviceInfo.serialNumber ?? this.state.config?.host ?? 'hikvision-terminal';

    return [
      {
        id,
        name: deviceInfo.deviceName ?? 'Hikvision terminal',
        location: this.state.config?.host,
      },
    ];
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date; message?: string }> {
    try {
      const config = this.requireConfig();
      const deviceInfo = await this.getDeviceInfo();
      const capabilities = await this.getAccessControlCapabilities();
      const teamReady = this.isTeamModeReady(config);
      const integrationMode = config.integrationMode ?? 'device';
      const missingFields = integrationMode === 'team' ? this.getMissingTeamModeFields(config) : [];

      return {
        connected: true,
        message:
          `${deviceInfo.model ?? 'Hikvision device'} online | mode=${integrationMode} | qr=${capabilities.isSupportQRCodeInfo ?? 'unknown'} | teamReady=${teamReady}` +
          (missingFields.length ? ` | missing=${missingFields.join(',')}` : ''),
      };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Unable to reach device',
      };
    }
  }

  private buildNativeQrPlaceholder(request: VisitorPassRequest, passId: string): string {
    return JSON.stringify({
      provider: this.id,
      passId,
      visitorId: request.visitorId,
      visitorName: request.visitorName,
      residentUnitId: request.residentUnitId,
      validFrom: request.validFrom.toISOString(),
      validUntil: request.validUntil.toISOString(),
    });
  }

  private async createVisitorPassViaTeamMode(
    request: VisitorPassRequest,
    config: AccessControlProviderConfig,
  ): Promise<VisitorPass> {
    const missing = this.getMissingTeamModeFields(config);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Hikvision Team Mode is not ready. Missing: ${missing.join(', ')}. ` +
          'The official flow requires Hik-Connect Team / HikCentral OpenAPI credentials and a visitor QR endpoint.',
      );
    }

    const accessLevelIds = request.metadata?.tempAuthId ? [] : this.resolveAccessLevelIds(request, config);
    if (!request.metadata?.tempAuthId && accessLevelIds.length === 0) {
      throw new BadRequestException(
        'Hikvision aun no tiene una concesion de acceso asignada para este pase. ' +
          'Configura HIKVISION_DEFAULT_ACCESS_GROUP_ID en el backend para que el pase pueda generarse.',
      );
    }

    const endpoint = request.metadata?.tempAuthId
      ? config.visitorGetEndpoint ?? this.inferTeamModeGetEndpoint(config)
      : config.visitorQrEndpoint!;
    const response = await this.callTeamModeEndpoint(
      endpoint,
      this.buildTeamModePayload(request, config, accessLevelIds),
      config,
    );
    this.assertTeamModeSuccess(response);

    const data = this.unwrapTeamModeData(response);
    const passId = data.accessControlPassId ?? data.passId ?? data.id;
    const resolvedPassId = String(passId ?? request.metadata?.tempAuthId ?? request.visitorId);
    const hydratedData =
      passId && !request.metadata?.tempAuthId
        ? await this.fetchTemporaryPassDetails(resolvedPassId, config, data)
        : data;
    const qrCode = this.normalizeTeamModeQrCode(hydratedData);

    if (!passId && !qrCode) {
      throw new Error(`Hikvision Team Mode returned no QR/pass data: ${JSON.stringify(response)}`);
    }

    return {
      id: resolvedPassId,
      qrCode,
      pin: hydratedData.pinCode ?? hydratedData.pin ?? hydratedData.password ?? data.pinCode ?? data.pin ?? data.password ?? undefined,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      status: 'active',
      createdAt: new Date(),
    };
  }

  private async fetchTemporaryPassDetails(
    passId: string,
    config: AccessControlProviderConfig,
    fallbackData: Record<string, any>,
  ): Promise<Record<string, any>> {
    const endpoint = config.visitorGetEndpoint ?? this.inferTeamModeGetEndpoint(config);

    try {
      const response = await this.callTeamModeEndpoint(endpoint, this.buildTemporaryPassIdPayload(passId), config);
      this.assertTeamModeSuccess(response);
      const details = this.unwrapTeamModeData(response);

      if (details.code) {
        const merged = {
          ...fallbackData,
          ...details,
        };

        delete merged.qrCode;
        delete merged.qrContent;
        delete merged.qrUrl;

        return merged;
      }

      return {
        ...fallbackData,
        ...details,
      };
    } catch {
      return fallbackData;
    }
  }

  private buildTeamModePayload(
    request: VisitorPassRequest,
    config: AccessControlProviderConfig,
    accessLevelIds: string[] = this.resolveAccessLevelIds(request, config),
  ): Record<string, any> {
    const tempAuthId = request.metadata?.tempAuthId;
    if (tempAuthId) {
      return {
        id: tempAuthId,
        clientLocalTime: buildClientLocalTime(request.metadata?.clientLocalTime),
      };
    }

    return {
      name: request.visitorName,
      openCount: request.maxEntries ?? 1,
      startTime: formatLocalOffsetDateTime(request.validFrom, request.metadata?.startTime),
      endTime: formatLocalOffsetDateTime(request.validUntil, request.metadata?.endTime),
      clientLocalTime: buildClientLocalTime(request.metadata?.clientLocalTime),
      alIds: accessLevelIds,
    };
  }

  private buildTemporaryPassIdPayload(passId: string): Record<string, any> {
    return {
      id: passId,
      clientLocalTime: buildClientLocalTime(),
    };
  }

  private buildTemporaryPassDeletePayload(passId: string): Record<string, any> {
    return {
      deleteList: [passId],
      clientLocalTime: buildClientLocalTime(),
    };
  }

  private async getDeviceInfo(): Promise<Record<string, string>> {
    if (this.state.deviceInfo) {
      return this.state.deviceInfo;
    }

    const deviceInfo = await this.requestXml('/ISAPI/System/deviceInfo');
    this.state.deviceInfo = deviceInfo;
    return deviceInfo;
  }

  private async getAccessControlCapabilities(): Promise<Record<string, string>> {
    if (this.state.capabilities) {
      return this.state.capabilities;
    }

    const capabilities = await this.requestXml('/ISAPI/AccessControl/capabilities');
    this.state.capabilities = capabilities;
    return capabilities;
  }

  private async requestXml(path: string, init?: RequestInit): Promise<Record<string, string>> {
    const response = await this.requestWithDigest(path, init);
    const xml = await response.text();
    return parseSimpleXml(xml);
  }

  private async callTeamModeEndpoint(
    endpoint: string,
    payload: Record<string, any>,
    config: AccessControlProviderConfig,
  ): Promise<Record<string, any>> {
    const session = await this.getTeamModeSession(config);
    const url = this.buildTeamModeUrl(endpoint, config, session.areaDomain);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildTeamModeHeaders(config, session.accessToken),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Hikvision Team Mode request failed with status ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as Record<string, any>;
    }

    const textBody = await response.text();
    return { raw: textBody };
  }

  private buildTeamModeHeaders(config: AccessControlProviderConfig, accessToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Token = accessToken;
    }

    if (config.teamAuthToken) {
      headers.Authorization = config.teamAuthToken.startsWith('Bearer ')
        ? config.teamAuthToken
        : `Bearer ${config.teamAuthToken}`;
    }

    if (config.teamSessionCookie) {
      headers.Cookie = config.teamSessionCookie;
    }

    return headers;
  }

  private assertTeamModeSuccess(response: Record<string, any>): void {
    const errorCode = response.errorCode ?? response.code;
    const message = response.message ?? response.msg ?? response.errorMsg;
    if (errorCode && String(errorCode) !== '0' && String(errorCode).toLowerCase() !== 'success') {
      throw new Error(`Hikvision Team Mode error ${errorCode}: ${message ?? 'Unknown error'}`);
    }
  }

  private unwrapTeamModeData(response: Record<string, any>): Record<string, any> {
    return (response.data as Record<string, any> | undefined) ?? response;
  }

  private normalizeTeamModeQrCode(response: Record<string, any>): string | undefined {
    const code = response.code ?? response.qrCode ?? response.qrContent ?? response.qrUrl;
    if (!code) {
      return undefined;
    }

    if (typeof code === 'string' && code.startsWith('data:image')) {
      return code;
    }

    if (typeof code === 'string' && looksLikeBase64Png(code)) {
      return `data:image/png;base64,${code}`;
    }

    return String(code);
  }

  private async getTeamModeSession(
    config: AccessControlProviderConfig,
  ): Promise<{ accessToken: string; areaDomain?: string; expireTime?: number }> {
    if (this.state.teamSession?.accessToken && !this.isTeamTokenExpired(this.state.teamSession.expireTime)) {
      return this.state.teamSession;
    }

    const tokenEndpoint = config.tokenEndpoint ?? '/api/hccgw/platform/v1/token/get';
    const url = this.buildTeamModeUrl(tokenEndpoint, config);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appKey: config.appKey,
        secretKey: config.appSecret,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Hikvision token request failed with status ${response.status}: ${errorBody}`);
    }

    const payload = (await response.json()) as Record<string, any>;
    this.assertTeamModeSuccess(payload);
    const data = this.unwrapTeamModeData(payload);
    const accessToken = data.accessToken;
    if (!accessToken) {
      throw new Error(`Hikvision token response did not include accessToken: ${JSON.stringify(payload)}`);
    }

    this.state.teamSession = {
      accessToken: String(accessToken),
      areaDomain: data.areaDomain ? String(data.areaDomain) : undefined,
      expireTime: data.expireTime ? Number(data.expireTime) : undefined,
    };

    return this.state.teamSession;
  }

  private isTeamTokenExpired(expireTime?: number): boolean {
    if (!expireTime) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return expireTime <= nowInSeconds + 60;
  }

  private buildTeamModeUrl(endpoint: string, config: AccessControlProviderConfig, areaDomain?: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    const baseUrl = (areaDomain || config.openApiBaseUrl || '').replace(/\/$/, '');
    return `${baseUrl}/${endpoint.replace(/^\//, '')}`;
  }

  private inferTeamModeGetEndpoint(config: AccessControlProviderConfig): string {
    if (config.visitorQrEndpoint?.includes('/add')) {
      return config.visitorQrEndpoint.replace('/add', '/get');
    }

    return '/api/hccgw/vims/v1/tempauth/get';
  }

  private resolveAccessLevelIds(request: VisitorPassRequest, config: AccessControlProviderConfig): string[] {
    const metadataIds = Array.isArray(request.metadata?.accessLevelIds)
      ? request.metadata.accessLevelIds
      : typeof request.metadata?.accessLevelIds === 'string'
        ? String(request.metadata.accessLevelIds).split(',')
        : [];
    const configuredIds = String(config.defaultAccessGroupId ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    return [...new Set([...metadataIds, ...configuredIds])]
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  private async requestWithDigest(path: string, init: RequestInit = {}): Promise<Response> {
    const config = this.requireConfig();
    const url = `${config.protocol ?? 'https'}://${config.host}:${config.port}${path}`;
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const dispatcher = this.getDispatcher(config);

    const first = await fetch(url, { ...init, method, headers, dispatcher });
    if (first.status !== 401) {
      if (!first.ok) {
        throw new Error(`Hikvision request failed with status ${first.status}`);
      }
      return first;
    }

    const challengeHeader = first.headers.get('www-authenticate');
    if (!challengeHeader?.toLowerCase().includes('digest')) {
      throw new Error('Hikvision digest challenge was not provided');
    }

    const challenge = parseDigestChallenge(challengeHeader);
    const authorization = buildDigestAuthorization({
      challenge,
      username: config.username,
      password: config.password,
      method,
      uri: path,
    });

    headers.set('Authorization', authorization);
    const second = await fetch(url, { ...init, method, headers, dispatcher });
    if (!second.ok) {
      throw new Error(`Hikvision request failed with status ${second.status}`);
    }

    return second;
  }

  private requireConfig(): AccessControlProviderConfig & { protocol?: 'http' | 'https' } {
    const config = this.state.config ?? this.mergeWithEnvDefaults();
    if (!config.host) {
      throw new Error('Hikvision provider is not configured');
    }

    return {
      protocol: 'https',
      allowInsecureTls: false,
      integrationMode: 'device',
      ...config,
    };
  }

  private mergeWithEnvDefaults(overrides: Partial<AccessControlProviderConfig> = {}): AccessControlProviderConfig {
    return {
      host: overrides.host ?? process.env.HIKVISION_API_HOST ?? '',
      port: overrides.port ?? Number(process.env.HIKVISION_API_PORT ?? 443),
      username: overrides.username ?? process.env.HIKVISION_USERNAME ?? '',
      password: overrides.password ?? process.env.HIKVISION_PASSWORD ?? '',
      protocol: overrides.protocol ?? ((process.env.HIKVISION_PROTOCOL as 'http' | 'https' | undefined) ?? 'https'),
      allowInsecureTls:
        overrides.allowInsecureTls ??
        (String(process.env.HIKVISION_ALLOW_INSECURE_TLS ?? 'false').toLowerCase() === 'true'),
      integrationMode:
        overrides.integrationMode ??
        ((process.env.HIKVISION_INTEGRATION_MODE as 'device' | 'team' | undefined) ?? 'device'),
      teamAccount: overrides.teamAccount ?? process.env.HIKVISION_TEAM_ACCOUNT ?? '',
      teamId: overrides.teamId ?? process.env.HIKVISION_TEAM_ID ?? '',
      teamAuthToken: overrides.teamAuthToken ?? process.env.HIKVISION_TEAM_AUTH_TOKEN ?? '',
      teamSessionCookie: overrides.teamSessionCookie ?? process.env.HIKVISION_TEAM_SESSION_COOKIE ?? '',
      openApiBaseUrl: overrides.openApiBaseUrl ?? process.env.HIKVISION_OPENAPI_BASE_URL ?? '',
      tokenEndpoint: overrides.tokenEndpoint ?? process.env.HIKVISION_TOKEN_ENDPOINT ?? '',
      appKey: overrides.appKey ?? process.env.HIKVISION_APP_KEY ?? '',
      appSecret: overrides.appSecret ?? process.env.HIKVISION_APP_SECRET ?? '',
      siteId: overrides.siteId ?? process.env.HIKVISION_SITE_ID ?? '',
      communityId: overrides.communityId ?? process.env.HIKVISION_COMMUNITY_ID ?? '',
      buildingId: overrides.buildingId ?? process.env.HIKVISION_BUILDING_ID ?? '',
      roomId: overrides.roomId ?? process.env.HIKVISION_ROOM_ID ?? '',
      defaultAccessGroupId:
        overrides.defaultAccessGroupId ?? process.env.HIKVISION_DEFAULT_ACCESS_GROUP_ID ?? '',
      visitorQrEndpoint:
        overrides.visitorQrEndpoint ?? process.env.HIKVISION_VISITOR_QR_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/add',
      visitorGetEndpoint:
        overrides.visitorGetEndpoint ?? process.env.HIKVISION_VISITOR_GET_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/get',
      visitorListEndpoint:
        overrides.visitorListEndpoint ?? process.env.HIKVISION_VISITOR_LIST_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/list',
      visitorRevokeEndpoint:
        overrides.visitorRevokeEndpoint ?? process.env.HIKVISION_VISITOR_REVOKE_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/delete',
      ...overrides,
    };
  }

  private isTeamModeReady(config: AccessControlProviderConfig): boolean {
    return this.getMissingTeamModeFields(config).length === 0;
  }

  private getMissingTeamModeFields(config: AccessControlProviderConfig): string[] {
    const requiredFields: Array<keyof AccessControlProviderConfig> = [
      'openApiBaseUrl',
      'appKey',
      'appSecret',
      'visitorQrEndpoint',
    ];

    return requiredFields
      .filter((field) => !config[field])
      .map((field) => String(field));
  }

  private getDispatcher(config: AccessControlProviderConfig): Agent | undefined {
    if (config.protocol !== 'https' || !config.allowInsecureTls) {
      return undefined;
    }

    return new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }
}

function parseDigestChallenge(header: string): DigestChallenge {
  const challenge: DigestChallenge = {};
  const value = header.replace(/^Digest\s+/i, '');

  for (const part of value.split(',')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey.trim();
    const rawValue = rest.join('=').trim().replace(/^"|"$/g, '');
    if (key) {
      challenge[key] = rawValue;
    }
  }

  return challenge;
}

function buildDigestAuthorization(args: {
  challenge: DigestChallenge;
  username: string;
  password: string;
  method: string;
  uri: string;
}): string {
  const { challenge, username, password, method, uri } = args;
  const realm = challenge.realm ?? '';
  const nonce = challenge.nonce ?? '';
  const qop = challenge.qop?.split(',')[0]?.trim() ?? 'auth';
  const nc = '00000001';
  const cnonce = cryptoRandomId(16);

  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);

  return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}", qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
}

function parseSimpleXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const tagRegex = /<([A-Za-z0-9_:-]+)>([^<]*)<\/\1>/g;

  for (const match of xml.matchAll(tagRegex)) {
    result[match[1]] = match[2].trim();
  }

  return result;
}

function cryptoRandomId(length = 24): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

function buildClientLocalTime(source?: string): string {
  if (source) {
    return source;
  }

  return formatLocalOffsetDateTime(new Date());
}

function formatLocalOffsetDateTime(date: Date, source?: string): string {
  if (source) {
    return source;
  }

  const now = date;
  const pad = (value: number) => String(value).padStart(2, '0');
  const timezoneOffset = -now.getTimezoneOffset();
  const sign = timezoneOffset >= 0 ? '+' : '-';
  const hours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
  const minutes = pad(Math.abs(timezoneOffset) % 60);

  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
    `${sign}${hours}:${minutes}`
  );
}

function looksLikeBase64Png(value: string): boolean {
  return /^[A-Za-z0-9+/=\r\n]+$/.test(value) && value.startsWith('iVBOR');
}

function collectTemporaryPassIds(payload: unknown): Set<string> {
  const snapshots = collectTemporaryPassSnapshots(payload);
  return new Set(snapshots.map((snapshot) => snapshot.passId));
}

function collectTemporaryPassSnapshots(payload: unknown): TemporaryPassSnapshot[] {
  const snapshots = new Map<string, TemporaryPassSnapshot>();
  const idKeys = ['id', 'passId', 'accessControlPassId', 'tempAuthId'];
  const nameKeys = ['name', 'visitorName', 'personName'];
  const emailKeys = ['email', 'visitorEmail', 'mail'];
  const fromKeys = ['startTime', 'validFrom', 'beginTime'];
  const untilKeys = ['endTime', 'validUntil', 'expireTime'];
  const statusKeys = ['status', 'state'];
  const qrKeys = ['qrCode', 'qrContent', 'qrUrl', 'code'];
  const countKeys = ['openCount', 'maxEntries'];

  const visit = (value: unknown) => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item));
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    const record = value as Record<string, unknown>;
    const passId = pickString(record, idKeys);

    if (passId && isTemporaryPassCandidate(record)) {
      const current = snapshots.get(passId) ?? { passId };
      const merged: TemporaryPassSnapshot = {
        passId,
        visitorName: current.visitorName ?? pickString(record, nameKeys),
        visitorEmail: current.visitorEmail ?? pickString(record, emailKeys),
        validFrom: current.validFrom ?? pickString(record, fromKeys),
        validUntil: current.validUntil ?? pickString(record, untilKeys),
        status: current.status ?? pickString(record, statusKeys),
        qrCode: current.qrCode ?? pickString(record, qrKeys),
        maxEntries: current.maxEntries ?? pickNumber(record, countKeys),
      };
      snapshots.set(passId, merged);
    }

    Object.values(record).forEach((nested) => visit(nested));
  };

  visit(payload);
  return Array.from(snapshots.values());
}

function isTemporaryPassCandidate(record: Record<string, unknown>): boolean {
  const knownKeys = [
    'startTime',
    'endTime',
    'openCount',
    'qrCode',
    'qrContent',
    'qrUrl',
    'visitorName',
    'name',
  ];

  return knownKeys.some((key) => key in record);
}

function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) {
      continue;
    }

    const text = String(value).trim();
    if (text) {
      return text;
    }
  }

  return undefined;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}
