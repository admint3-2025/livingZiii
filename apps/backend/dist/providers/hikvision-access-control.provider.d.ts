import { AccessControlProvider, AccessControlProviderConfig, AccessEvent, VisitorPass, VisitorPassRequest } from './access-control.types';
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
export declare class HikvisionAccessControlProvider implements AccessControlProvider {
    id: string;
    name: string;
    private state;
    validateCredentials(config: AccessControlProviderConfig): Promise<boolean>;
    createVisitorPass(request: VisitorPassRequest): Promise<VisitorPass>;
    revokePass(passId: string): Promise<void>;
    listTemporaryPassIds(): Promise<Set<string>>;
    listTemporaryPasses(): Promise<TemporaryPassSnapshot[]>;
    temporaryPassExists(passId: string): Promise<boolean>;
    syncAccessEvents(_since: Date, _limit?: number): Promise<AccessEvent[]>;
    getAccessEvent(eventId: string): Promise<AccessEvent | null>;
    listAccessPoints(): Promise<Array<{
        id: string;
        name: string;
        location?: string;
    }>>;
    getStatus(): Promise<{
        connected: boolean;
        lastSync?: Date;
        message?: string;
    }>;
    private buildNativeQrPlaceholder;
    private createVisitorPassViaTeamMode;
    private fetchTemporaryPassDetails;
    private buildTeamModePayload;
    private buildTemporaryPassIdPayload;
    private buildTemporaryPassDeletePayload;
    private getDeviceInfo;
    private getAccessControlCapabilities;
    private requestXml;
    private callTeamModeEndpoint;
    private buildTeamModeHeaders;
    private assertTeamModeSuccess;
    private unwrapTeamModeData;
    private normalizeTeamModeQrCode;
    private getTeamModeSession;
    private isTeamTokenExpired;
    private buildTeamModeUrl;
    private inferTeamModeGetEndpoint;
    private resolveAccessLevelIds;
    private requestWithDigest;
    private requireConfig;
    private mergeWithEnvDefaults;
    private isTeamModeReady;
    private getMissingTeamModeFields;
    private getDispatcher;
}
export {};
//# sourceMappingURL=hikvision-access-control.provider.d.ts.map