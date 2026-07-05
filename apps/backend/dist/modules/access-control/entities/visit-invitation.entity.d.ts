import { Unit } from '@/modules/units/entities/unit.entity';
import { Property } from '@/modules/properties/entities/property.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare class VisitInvitation {
    id: string;
    propertyId: string;
    property: Property;
    unitId: string;
    unit: Unit;
    visitorName: string;
    visitorPhone: string;
    visitorEmail: string;
    purpose: string;
    validFrom: Date;
    validUntil: Date;
    status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired' | 'revoked';
    createdBy: string;
    resident: User;
    approvedBy: string;
    approvedAt: Date;
    accessControlPassId: string;
    qrCode: string;
    pinCode: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
//# sourceMappingURL=visit-invitation.entity.d.ts.map