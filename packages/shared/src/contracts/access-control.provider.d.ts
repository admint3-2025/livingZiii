/**
 * ACCESS CONTROL PROVIDER CONTRACTS
 *
 * Define a pluggable access control provider system that allows integration
 * with multiple hardware/software providers (Hikvision, Dahua, ZKTeco, Suprema, HID, etc.)
 *
 * This is the NORTH STRATEGIC module: integrating physical access control
 * with ZIII's visitor management and audit system.
 */
export interface AccessControlProviderConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    apiVersion?: string;
    [key: string]: any;
}
export declare enum AccessEventType {
    ENTRY = "entry",
    EXIT = "exit",
    ENTRY_DENIED = "entry_denied",
    EXIT_DENIED = "exit_denied",
    ALARM = "alarm",
    MANUAL_OPEN = "manual_open"
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
/**
 * Main AccessControlProvider interface
 */
export interface AccessControlProvider {
    /**
     * Unique identifier for the provider
     * e.g., 'hikvision', 'dahua', 'zkteco', 'suprema', 'hid'
     */
    id: string;
    /**
     * Display name
     */
    name: string;
    /**
     * Initialize and validate connection with the provider
     */
    validateCredentials(config: AccessControlProviderConfig): Promise<boolean>;
    /**
     * Create a temporary visitor pass (generates QR or similar)
     * The pass can be scanned at the gate or validated by a guard app
     */
    createVisitorPass(request: VisitorPassRequest): Promise<VisitorPass>;
    /**
     * Revoke a visitor pass (make it invalid)
     */
    revokePass(passId: string): Promise<void>;
    /**
     * Sync access events from the provider
     * Used to download recent access logs and update ZIII's bitácora
     */
    syncAccessEvents(since: Date, limit?: number): Promise<AccessEvent[]>;
    /**
     * Get a single access event
     */
    getAccessEvent(eventId: string): Promise<AccessEvent | null>;
    /**
     * List access points (doors, gates, readers)
     */
    listAccessPoints(): Promise<Array<{
        id: string;
        name: string;
        location?: string;
    }>>;
    /**
     * Register a webhook to receive real-time access events
     * Provider will POST access events to this URL as they happen
     */
    registerWebhook?(webhookUrl: string, events?: string[]): Promise<void>;
    /**
     * Handle incoming webhook from access control hardware
     * Typically called by the backend API when hardware sends an event
     */
    handleWebhook?(payload: Record<string, any>): Promise<AccessEvent | null>;
    /**
     * Get provider health/connection status
     */
    getStatus(): Promise<{
        connected: boolean;
        lastSync?: Date;
        message?: string;
    }>;
}
/**
 * Factory to register and manage multiple access control providers
 */
export interface AccessControlProviderFactory {
    register(provider: AccessControlProvider): void;
    unregister(providerId: string): void;
    get(providerId: string): AccessControlProvider | null;
    list(): AccessControlProvider[];
}
/**
 * ZIII-side representation of a visitor and their pass
 * Stored in ZIII database, tied to property/unit
 */
export interface VisitInvitation {
    id: string;
    visitorName: string;
    visitorPhone?: string;
    visitorEmail?: string;
    visitorPhoto?: string;
    residentUnitId: string;
    propertyId: string;
    purpose?: string;
    validFrom: Date;
    validUntil: Date;
    status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired';
    createdBy: string;
    createdAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
    accessControlProviderId: string;
    accessControlPassId: string;
    qrCode?: string;
    auditLog: VisitAuditLogEntry[];
}
export interface VisitAuditLogEntry {
    timestamp: Date;
    action: 'created' | 'approved' | 'rejected' | 'entry' | 'exit' | 'revoked';
    actor: string;
    details?: Record<string, any>;
}
//# sourceMappingURL=access-control.provider.d.ts.map