import { AccessControlService } from './access-control.service';
import { CreateAccessControlProviderDto } from './dtos/create-access-control-provider.dto';
import { CreateVisitInvitationDto } from './dtos/create-visit-invitation.dto';
import { SendVisitInvitationEmailDto } from './dtos/send-visit-invitation-email.dto';
import { UpdateVisitInvitationDto } from './dtos/update-visit-invitation.dto';
export declare class AccessControlController {
    private readonly accessControlService;
    constructor(accessControlService: AccessControlService);
    listProviders(): Promise<{
        id: string;
        name: string;
    }[]>;
    validateProvider(providerId: string, dto: CreateAccessControlProviderDto): Promise<boolean>;
    providerStatus(providerId: string): Promise<{
        connected: boolean;
        lastSync?: Date;
        message?: string;
    }>;
    getDemoContext(): Promise<{
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
        invitation: import("./entities/visit-invitation.entity").VisitInvitation;
        pass: import("../../providers/access-control.types").VisitorPass;
        share: {
            title: string;
            shareUrl: string;
            qrCode: string;
            message: string;
        };
    }>;
    findAllInvitations(): Promise<import("./entities/visit-invitation.entity").VisitInvitation[]>;
    findInvitationById(id: string): Promise<import("./entities/visit-invitation.entity").VisitInvitation | null>;
    updateInvitation(id: string, dto: UpdateVisitInvitationDto): Promise<import("./entities/visit-invitation.entity").VisitInvitation | null>;
    deleteInvitation(id: string): Promise<{
        deleted: boolean;
        id: string;
        providerRevoked: boolean;
    }>;
    shareInvitation(id: string): Promise<{
        id: string;
        visitorName: string;
        qrCode: string;
        shareUrl: string;
    } | null>;
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
}
//# sourceMappingURL=access-control.controller.d.ts.map