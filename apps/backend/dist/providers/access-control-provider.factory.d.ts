import { AccessControlProvider, AccessControlProviderFactory } from './access-control.types';
export declare class AccessControlProviderFactoryService implements AccessControlProviderFactory {
    private readonly providers;
    register(provider: AccessControlProvider): void;
    unregister(providerId: string): void;
    get(providerId: string): AccessControlProvider | null;
    list(): AccessControlProvider[];
}
//# sourceMappingURL=access-control-provider.factory.d.ts.map