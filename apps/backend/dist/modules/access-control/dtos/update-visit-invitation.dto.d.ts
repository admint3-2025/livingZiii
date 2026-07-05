export declare class UpdateVisitInvitationDto {
    status?: 'pending' | 'approved' | 'rejected' | 'used' | 'expired' | 'revoked';
    approvedBy?: string;
    approvedAt?: string;
    accessControlPassId?: string;
    qrCode?: string;
    pinCode?: string;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=update-visit-invitation.dto.d.ts.map