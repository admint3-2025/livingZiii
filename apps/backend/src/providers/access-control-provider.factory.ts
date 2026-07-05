import { Injectable } from '@nestjs/common';
import { AccessControlProvider, AccessControlProviderFactory } from './access-control.types';

@Injectable()
export class AccessControlProviderFactoryService implements AccessControlProviderFactory {
  private readonly providers = new Map<string, AccessControlProvider>();

  register(provider: AccessControlProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  get(providerId: string): AccessControlProvider | null {
    return this.providers.get(providerId) ?? null;
  }

  list(): AccessControlProvider[] {
    return [...this.providers.values()];
  }
}
