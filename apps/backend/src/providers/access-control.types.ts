export interface AccessControlProviderConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  apiVersion?: string;
  protocol?: 'http' | 'https';
  allowInsecureTls?: boolean;
  integrationMode?: 'device' | 'team';
  appKey?: string;
  appSecret?: string;
  openApiBaseUrl?: string;
  tokenEndpoint?: string;
  teamAccount?: string;
  teamId?: string;
  teamAuthToken?: string;
  teamSessionCookie?: string;
  siteId?: string;
  communityId?: string;
  buildingId?: string;
  roomId?: string;
  defaultAccessGroupId?: string;
  visitorQrEndpoint?: string;
  visitorGetEndpoint?: string;
  visitorListEndpoint?: string;
  visitorRevokeEndpoint?: string;
  [key: string]: any;
}

export enum AccessEventType {
  ENTRY = 'entry',
  EXIT = 'exit',
  ENTRY_DENIED = 'entry_denied',
  EXIT_DENIED = 'exit_denied',
  ALARM = 'alarm',
  MANUAL_OPEN = 'manual_open',
}

export interface AccessEvent {
  id: string;
  timestamp: Date;
  type: AccessEventType;
  personId?: string;
  visitPassId?: string;
  deviceId: string;
  doorId: string;
  location?: string;
  photo?: string;
  success: boolean;
  details?: Record<string, any>;
}

export interface VisitorPassRequest {
  visitorId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  residentUnitId: string;
  validFrom: Date;
  validUntil: Date;
  allowedDoors?: string[];
  maxEntries?: number;
  metadata?: Record<string, any>;
}

export interface VisitorPass {
  id: string;
  qrCode?: string;
  nfcToken?: string;
  pin?: string;
  validFrom: Date;
  validUntil: Date;
  status: 'active' | 'expired' | 'revoked' | 'used';
  createdAt: Date;
}

export interface AccessControlProvider {
  id: string;
  name: string;
  validateCredentials(config: AccessControlProviderConfig): Promise<boolean>;
  createVisitorPass(request: VisitorPassRequest): Promise<VisitorPass>;
  revokePass(passId: string): Promise<void>;
  syncAccessEvents(since: Date, limit?: number): Promise<AccessEvent[]>;
  getAccessEvent(eventId: string): Promise<AccessEvent | null>;
  listAccessPoints(): Promise<Array<{ id: string; name: string; location?: string }>>;
  registerWebhook?(webhookUrl: string, events?: string[]): Promise<void>;
  handleWebhook?(payload: Record<string, any>): Promise<AccessEvent | null>;
  getStatus(): Promise<{ connected: boolean; lastSync?: Date; message?: string }>;
}

export interface AccessControlProviderFactory {
  register(provider: AccessControlProvider): void;
  unregister(providerId: string): void;
  get(providerId: string): AccessControlProvider | null;
  list(): AccessControlProvider[];
}
