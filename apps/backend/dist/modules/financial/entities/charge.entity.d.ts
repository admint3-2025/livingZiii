import { Unit } from '@/modules/units/entities/unit.entity';
export declare enum ChargeType {
    FINE = "fine",// Multa
    INTEREST = "interest",// Intereses
    SERVICE = "service",// Servicio específico
    OTHER = "other"
}
export declare enum ChargeStatus {
    PENDING = "pending",
    PAID = "paid",
    CANCELLED = "cancelled",
    WAIVED = "waived"
}
export declare class Charge {
    id: string;
    unitId: string;
    unit: Unit;
    type: ChargeType;
    amount: number;
    dueDate: Date;
    status: ChargeStatus;
    description: string;
    relatedQuotaId: string;
    createdBy: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
//# sourceMappingURL=charge.entity.d.ts.map