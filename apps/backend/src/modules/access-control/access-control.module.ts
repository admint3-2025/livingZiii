import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';
import { AccessEvent } from './entities/access-event.entity';
import { VisitInvitation } from './entities/visit-invitation.entity';
import { AccessControlProviderFactoryService } from '@/providers/access-control-provider.factory';
import { HikvisionAccessControlProvider } from '@/providers/hikvision-access-control.provider';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Property } from '@/modules/properties/entities/property.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
import { User } from '@/modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VisitInvitation, AccessEvent, Organization, Property, Unit, User])],
  controllers: [AccessControlController],
  providers: [
    AccessControlService,
    AccessControlProviderFactoryService,
    HikvisionAccessControlProvider,
    {
      provide: 'ACCESS_CONTROL_PROVIDER_BOOTSTRAP',
      inject: [AccessControlProviderFactoryService, HikvisionAccessControlProvider],
      useFactory: (factory: AccessControlProviderFactoryService, hikvision: HikvisionAccessControlProvider) => {
        factory.register(hikvision);
        return true;
      },
    },
  ],
  exports: [AccessControlService, AccessControlProviderFactoryService, HikvisionAccessControlProvider],
})
export class AccessControlModule {}
