export declare class CreateAccessControlProviderDto {
    providerId: string;
    host: string;
    port: number;
    username: string;
    password: string;
    protocol?: 'http' | 'https';
    integrationMode?: 'device' | 'team';
    appKey?: string;
    appSecret?: string;
    openApiBaseUrl?: string;
    teamAccount?: string;
    teamId?: string;
    siteId?: string;
    communityId?: string;
    buildingId?: string;
    roomId?: string;
    defaultAccessGroupId?: string;
    visitorQrEndpoint?: string;
    visitorRevokeEndpoint?: string;
}
//# sourceMappingURL=create-access-control-provider.dto.d.ts.map