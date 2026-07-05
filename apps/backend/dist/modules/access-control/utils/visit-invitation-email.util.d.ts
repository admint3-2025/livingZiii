import { VisitInvitation } from '../entities/visit-invitation.entity';
interface VisitInvitationEmailOptions {
    invitation: VisitInvitation;
    shareUrl: string;
    logoCid?: string;
    qrCid?: string;
    unitLabel?: string;
    residentName?: string;
}
export declare function resolveQrInlineImage(qrCode?: string | null): Promise<{
    buffer: Buffer;
    contentType: string;
    extension: string;
} | null>;
export declare function buildVisitInvitationEmailHtml({ invitation, shareUrl, logoCid, qrCid, unitLabel, residentName, }: VisitInvitationEmailOptions): string;
export declare function buildVisitInvitationEmailText(invitation: VisitInvitation, shareUrl: string, residentName?: string): string;
export declare function extractInlinePng(qrCode?: string | null): Buffer | null;
export {};
//# sourceMappingURL=visit-invitation-email.util.d.ts.map