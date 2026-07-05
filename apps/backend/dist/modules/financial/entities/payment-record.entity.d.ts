import { Unit } from '@/modules/units/entities/unit.entity';
export declare enum PaymentRecordStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    APPROVED = "approved",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare class PaymentRecord {
    id: string;
    unitId: string;
    unit: Unit;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentProviderId: string;
    status: PaymentRecordStatus;
    description: string;
    appliedToQuotaIds: string[];
    providerResponse: Record<string, any>;
    receiptUrl: string;
    createdAt: Date;
}
//# sourceMappingURL=payment-record.entity.d.ts.map