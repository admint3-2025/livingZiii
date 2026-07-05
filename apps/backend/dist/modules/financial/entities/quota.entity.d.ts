import { Unit } from '@/modules/units/entities/unit.entity';
import { Property } from '@/modules/properties/entities/property.entity';
export declare enum QuotaType {
    ORDINARY = "ordinary",// Mantenimiento
    EXTRAORDINARY = "extraordinary"
}
export declare enum QuotaStatus {
    PENDING = "pending",
    PARTIAL = "partial",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare class Quota {
    id: string;
    unitId: string;
    unit: Unit;
    propertyId: string;
    property: Property;
    quotaNumber: string;
    type: QuotaType;
    amount: number;
    dueDate: Date;
    paymentDate: Date;
    paidAmount: number;
    status: QuotaStatus;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
//# sourceMappingURL=quota.entity.d.ts.map