import { Repository } from 'typeorm';
import { AccessControlProviderFactoryService } from '@/providers/access-control-provider.factory';
import { AccessControlProviderConfig } from '@/providers/access-control.types';
import { HikvisionAccessControlProvider } from '@/providers/hikvision-access-control.provider';
import { AccessEvent } from './entities/access-event.entity';
import { VisitInvitation } from './entities/visit-invitation.entity';
import { CreateVisitInvitationDto } from './dtos/create-visit-invitation.dto';
import { SendVisitInvitationEmailDto } from './dtos/send-visit-invitation-email.dto';
import { UpdateVisitInvitationDto } from './dtos/update-visit-invitation.dto';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Property } from '@/modules/properties/entities/property.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare class AccessControlService {
    private readonly visitInvitationsRepository;
    private readonly accessEventsRepository;
    private readonly organizationsRepository;
    private readonly propertiesRepository;
    private readonly unitsRepository;
    private readonly usersRepository;
    private readonly providerFactory;
    private readonly hikvisionProvider;
    private readonly logger;
    constructor(visitInvitationsRepository: Repository<VisitInvitation>, accessEventsRepository: Repository<AccessEvent>, organizationsRepository: Repository<Organization>, propertiesRepository: Repository<Property>, unitsRepository: Repository<Unit>, usersRepository: Repository<User>, providerFactory: AccessControlProviderFactoryService, hikvisionProvider: HikvisionAccessControlProvider);
    listProviders(): Promise<{
        id: string;
        name: string;
    }[]>;
    validateProvider(providerId: string, config: AccessControlProviderConfig): Promise<boolean>;
    getProviderStatus(providerId: string): Promise<{
        connected: boolean;
        lastSync?: Date;
        message?: string;
    }>;
    getOrCreateDemoContext(): Promise<{
        organization: {
            id: string;
            name: string;
        };
        property: {
            id: string;
            name: string;
        };
        unit: {
            id: string;
            unitNumber: string;
        };
        resident: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    createInvitation(dto: CreateVisitInvitationDto): Promise<{
        invitation: VisitInvitation;
        pass: import("@/providers/access-control.types").VisitorPass;
        share: {
            title: string;
            shareUrl: string;
            qrCode: string;
            message: string;
        };
    }>;
    findAllInvitations(): Promise<VisitInvitation[]>;
    findInvitationById(id: string): Promise<VisitInvitation | null>;
    sendInvitationEmail(id: string, dto: SendVisitInvitationEmailDto): Promise<{
        sent: boolean;
        invitationId: string;
        to: string;
        subject: string;
        messageId: any;
        shareUrl: string;
        previewUrl: string | undefined;
        transportFallback: boolean;
        transport: "smtp" | "ethereal";
        smtpPort: number;
    }>;
    updateInvitation(id: string, dto: UpdateVisitInvitationDto): Promise<VisitInvitation | null>;
    deleteInvitation(id: string): Promise<{
        deleted: boolean;
        id: string;
        providerRevoked: boolean;
    }>;
    getEvents(): Promise<AccessEvent[]>;
    private requireProvider;
    private buildSharePayload;
    private resolveWebBaseUrl;
    private resolveMailErrorMessage;
    private shouldRetryGmailSsl;
    private shouldPreferGmailSsl;
    private syncInvitationsWithHikvision;
    private parseHikDate;
    private mapHikPassStatus;
}
//# sourceMappingURL=access-control.service.d.ts.map