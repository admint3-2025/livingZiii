"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HikvisionAccessControlProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const undici_1 = require("undici");
let HikvisionAccessControlProvider = class HikvisionAccessControlProvider {
    constructor() {
        this.id = 'hikvision';
        this.name = 'Hikvision Access Control';
        this.state = {};
    }
    async validateCredentials(config) {
        this.state.config = this.mergeWithEnvDefaults(config);
        const deviceInfo = await this.requestXml('/ISAPI/System/deviceInfo');
        this.state.deviceInfo = deviceInfo;
        return Boolean(deviceInfo.model || deviceInfo.deviceName);
    }
    async createVisitorPass(request) {
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
    async revokePass(passId) {
        const config = this.requireConfig();
        if (config.integrationMode === 'team' && config.visitorRevokeEndpoint) {
            const response = await this.callTeamModeEndpoint(config.visitorRevokeEndpoint, this.buildTemporaryPassDeletePayload(passId), config);
            this.assertTeamModeSuccess(response);
            return;
        }
        void passId;
    }
    async listTemporaryPassIds() {
        const snapshots = await this.listTemporaryPasses();
        return new Set(snapshots.map((snapshot) => snapshot.passId));
    }
    async listTemporaryPasses() {
        const config = this.requireConfig();
        if (config.integrationMode !== 'team' || !config.visitorListEndpoint) {
            return [];
        }
        const response = await this.callTeamModeEndpoint(config.visitorListEndpoint, {
            pageNum: 1,
            pageSize: 500,
            searchRequest: {
                filter: {
                    name: '',
                },
            },
        }, config);
        this.assertTeamModeSuccess(response);
        return collectTemporaryPassSnapshots(response);
    }
    async temporaryPassExists(passId) {
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
        }
        catch (error) {
            if (error instanceof Error && /not\s*found|not\s*exist|no\s*data|不存在|deleted|invalid/i.test(error.message)) {
                return false;
            }
            throw error;
        }
    }
    async syncAccessEvents(_since, _limit = 100) {
        // The device exposes access-control capabilities, but the exact event collection endpoint still needs
        // model/firmware-specific confirmation before we hard-code it.
        return [];
    }
    async getAccessEvent(eventId) {
        void eventId;
        return null;
    }
    async listAccessPoints() {
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
    async getStatus() {
        try {
            const config = this.requireConfig();
            const deviceInfo = await this.getDeviceInfo();
            const capabilities = await this.getAccessControlCapabilities();
            const teamReady = this.isTeamModeReady(config);
            const integrationMode = config.integrationMode ?? 'device';
            const missingFields = integrationMode === 'team' ? this.getMissingTeamModeFields(config) : [];
            return {
                connected: true,
                message: `${deviceInfo.model ?? 'Hikvision device'} online | mode=${integrationMode} | qr=${capabilities.isSupportQRCodeInfo ?? 'unknown'} | teamReady=${teamReady}` +
                    (missingFields.length ? ` | missing=${missingFields.join(',')}` : ''),
            };
        }
        catch (error) {
            return {
                connected: false,
                message: error instanceof Error ? error.message : 'Unable to reach device',
            };
        }
    }
    buildNativeQrPlaceholder(request, passId) {
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
    async createVisitorPassViaTeamMode(request, config) {
        const missing = this.getMissingTeamModeFields(config);
        if (missing.length > 0) {
            throw new common_1.BadRequestException(`Hikvision Team Mode is not ready. Missing: ${missing.join(', ')}. ` +
                'The official flow requires Hik-Connect Team / HikCentral OpenAPI credentials and a visitor QR endpoint.');
        }
        const accessLevelIds = request.metadata?.tempAuthId ? [] : this.resolveAccessLevelIds(request, config);
        if (!request.metadata?.tempAuthId && accessLevelIds.length === 0) {
            throw new common_1.BadRequestException('Hikvision aun no tiene una concesion de acceso asignada para este pase. ' +
                'Configura HIKVISION_DEFAULT_ACCESS_GROUP_ID en el backend para que el pase pueda generarse.');
        }
        const endpoint = request.metadata?.tempAuthId
            ? config.visitorGetEndpoint ?? this.inferTeamModeGetEndpoint(config)
            : config.visitorQrEndpoint;
        const response = await this.callTeamModeEndpoint(endpoint, this.buildTeamModePayload(request, config, accessLevelIds), config);
        this.assertTeamModeSuccess(response);
        const data = this.unwrapTeamModeData(response);
        const passId = data.accessControlPassId ?? data.passId ?? data.id;
        const resolvedPassId = String(passId ?? request.metadata?.tempAuthId ?? request.visitorId);
        const hydratedData = passId && !request.metadata?.tempAuthId
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
    async fetchTemporaryPassDetails(passId, config, fallbackData) {
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
        }
        catch {
            return fallbackData;
        }
    }
    buildTeamModePayload(request, config, accessLevelIds = this.resolveAccessLevelIds(request, config)) {
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
    buildTemporaryPassIdPayload(passId) {
        return {
            id: passId,
            clientLocalTime: buildClientLocalTime(),
        };
    }
    buildTemporaryPassDeletePayload(passId) {
        return {
            deleteList: [passId],
            clientLocalTime: buildClientLocalTime(),
        };
    }
    async getDeviceInfo() {
        if (this.state.deviceInfo) {
            return this.state.deviceInfo;
        }
        const deviceInfo = await this.requestXml('/ISAPI/System/deviceInfo');
        this.state.deviceInfo = deviceInfo;
        return deviceInfo;
    }
    async getAccessControlCapabilities() {
        if (this.state.capabilities) {
            return this.state.capabilities;
        }
        const capabilities = await this.requestXml('/ISAPI/AccessControl/capabilities');
        this.state.capabilities = capabilities;
        return capabilities;
    }
    async requestXml(path, init) {
        const response = await this.requestWithDigest(path, init);
        const xml = await response.text();
        return parseSimpleXml(xml);
    }
    async callTeamModeEndpoint(endpoint, payload, config) {
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
            return (await response.json());
        }
        const textBody = await response.text();
        return { raw: textBody };
    }
    buildTeamModeHeaders(config, accessToken) {
        const headers = {
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
    assertTeamModeSuccess(response) {
        const errorCode = response.errorCode ?? response.code;
        const message = response.message ?? response.msg ?? response.errorMsg;
        if (errorCode && String(errorCode) !== '0' && String(errorCode).toLowerCase() !== 'success') {
            throw new Error(`Hikvision Team Mode error ${errorCode}: ${message ?? 'Unknown error'}`);
        }
    }
    unwrapTeamModeData(response) {
        return response.data ?? response;
    }
    normalizeTeamModeQrCode(response) {
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
    async getTeamModeSession(config) {
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
        const payload = (await response.json());
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
    isTeamTokenExpired(expireTime) {
        if (!expireTime) {
            return false;
        }
        const nowInSeconds = Math.floor(Date.now() / 1000);
        return expireTime <= nowInSeconds + 60;
    }
    buildTeamModeUrl(endpoint, config, areaDomain) {
        if (endpoint.startsWith('http')) {
            return endpoint;
        }
        const baseUrl = (areaDomain || config.openApiBaseUrl || '').replace(/\/$/, '');
        return `${baseUrl}/${endpoint.replace(/^\//, '')}`;
    }
    inferTeamModeGetEndpoint(config) {
        if (config.visitorQrEndpoint?.includes('/add')) {
            return config.visitorQrEndpoint.replace('/add', '/get');
        }
        return '/api/hccgw/vims/v1/tempauth/get';
    }
    resolveAccessLevelIds(request, config) {
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
    async requestWithDigest(path, init = {}) {
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
    requireConfig() {
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
    mergeWithEnvDefaults(overrides = {}) {
        return {
            host: overrides.host ?? process.env.HIKVISION_API_HOST ?? '',
            port: overrides.port ?? Number(process.env.HIKVISION_API_PORT ?? 443),
            username: overrides.username ?? process.env.HIKVISION_USERNAME ?? '',
            password: overrides.password ?? process.env.HIKVISION_PASSWORD ?? '',
            protocol: overrides.protocol ?? (process.env.HIKVISION_PROTOCOL ?? 'https'),
            allowInsecureTls: overrides.allowInsecureTls ??
                (String(process.env.HIKVISION_ALLOW_INSECURE_TLS ?? 'false').toLowerCase() === 'true'),
            integrationMode: overrides.integrationMode ??
                (process.env.HIKVISION_INTEGRATION_MODE ?? 'device'),
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
            defaultAccessGroupId: overrides.defaultAccessGroupId ?? process.env.HIKVISION_DEFAULT_ACCESS_GROUP_ID ?? '',
            visitorQrEndpoint: overrides.visitorQrEndpoint ?? process.env.HIKVISION_VISITOR_QR_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/add',
            visitorGetEndpoint: overrides.visitorGetEndpoint ?? process.env.HIKVISION_VISITOR_GET_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/get',
            visitorListEndpoint: overrides.visitorListEndpoint ?? process.env.HIKVISION_VISITOR_LIST_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/list',
            visitorRevokeEndpoint: overrides.visitorRevokeEndpoint ?? process.env.HIKVISION_VISITOR_REVOKE_ENDPOINT ?? '/api/hccgw/vims/v1/tempauth/delete',
            ...overrides,
        };
    }
    isTeamModeReady(config) {
        return this.getMissingTeamModeFields(config).length === 0;
    }
    getMissingTeamModeFields(config) {
        const requiredFields = [
            'openApiBaseUrl',
            'appKey',
            'appSecret',
            'visitorQrEndpoint',
        ];
        return requiredFields
            .filter((field) => !config[field])
            .map((field) => String(field));
    }
    getDispatcher(config) {
        if (config.protocol !== 'https' || !config.allowInsecureTls) {
            return undefined;
        }
        return new undici_1.Agent({
            connect: {
                rejectUnauthorized: false,
            },
        });
    }
};
exports.HikvisionAccessControlProvider = HikvisionAccessControlProvider;
exports.HikvisionAccessControlProvider = HikvisionAccessControlProvider = __decorate([
    (0, common_1.Injectable)()
], HikvisionAccessControlProvider);
function parseDigestChallenge(header) {
    const challenge = {};
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
function buildDigestAuthorization(args) {
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
function parseSimpleXml(xml) {
    const result = {};
    const tagRegex = /<([A-Za-z0-9_:-]+)>([^<]*)<\/\1>/g;
    for (const match of xml.matchAll(tagRegex)) {
        result[match[1]] = match[2].trim();
    }
    return result;
}
function cryptoRandomId(length = 24) {
    return (0, crypto_1.randomBytes)(length).toString('hex').slice(0, length);
}
function md5(value) {
    return (0, crypto_1.createHash)('md5').update(value).digest('hex');
}
function buildClientLocalTime(source) {
    if (source) {
        return source;
    }
    return formatLocalOffsetDateTime(new Date());
}
function formatLocalOffsetDateTime(date, source) {
    if (source) {
        return source;
    }
    const now = date;
    const pad = (value) => String(value).padStart(2, '0');
    const timezoneOffset = -now.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? '+' : '-';
    const hours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
    const minutes = pad(Math.abs(timezoneOffset) % 60);
    return (`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
        `${sign}${hours}:${minutes}`);
}
function looksLikeBase64Png(value) {
    return /^[A-Za-z0-9+/=\r\n]+$/.test(value) && value.startsWith('iVBOR');
}
function collectTemporaryPassIds(payload) {
    const snapshots = collectTemporaryPassSnapshots(payload);
    return new Set(snapshots.map((snapshot) => snapshot.passId));
}
function collectTemporaryPassSnapshots(payload) {
    const snapshots = new Map();
    const idKeys = ['id', 'passId', 'accessControlPassId', 'tempAuthId'];
    const nameKeys = ['name', 'visitorName', 'personName'];
    const emailKeys = ['email', 'visitorEmail', 'mail'];
    const fromKeys = ['startTime', 'validFrom', 'beginTime'];
    const untilKeys = ['endTime', 'validUntil', 'expireTime'];
    const statusKeys = ['status', 'state'];
    const qrKeys = ['qrCode', 'qrContent', 'qrUrl', 'code'];
    const countKeys = ['openCount', 'maxEntries'];
    const visit = (value) => {
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
        const record = value;
        const passId = pickString(record, idKeys);
        if (passId && isTemporaryPassCandidate(record)) {
            const current = snapshots.get(passId) ?? { passId };
            const merged = {
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
function isTemporaryPassCandidate(record) {
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
function pickString(record, keys) {
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
function pickNumber(record, keys) {
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
//# sourceMappingURL=hikvision-access-control.provider.js.map