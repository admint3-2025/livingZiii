import { QuotaType } from '../entities/quota.entity';
export declare class CreateQuotaDto {
    unitId: string;
    propertyId: string;
    type: QuotaType;
    amount: number;
    dueDate: Date;
    description?: string;
}
export declare class UpdateQuotaDto {
    amount?: number;
    dueDate?: Date;
    description?: string;
}
export declare class StateOfAccountDto {
    unitId: string;
    fromDate?: Date;
    toDate?: Date;
}
//# sourceMappingURL=quota.dto.d.ts.map