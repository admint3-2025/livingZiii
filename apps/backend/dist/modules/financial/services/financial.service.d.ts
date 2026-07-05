import { Repository } from 'typeorm';
import { Quota } from '../entities/quota.entity';
import { CreateQuotaDto, UpdateQuotaDto } from '../dtos/quota.dto';
export declare class FinancialService {
    private quotasRepository;
    private readonly logger;
    constructor(quotasRepository: Repository<Quota>);
    createQuota(dto: CreateQuotaDto): Promise<Quota>;
    findQuotasForUnit(unitId: string): Promise<Quota[]>;
    findById(id: string): Promise<Quota | null>;
    updateQuota(id: string, dto: UpdateQuotaDto): Promise<Quota | null>;
    getStateOfAccount(unitId: string): Promise<{
        total: number;
        paid: number;
        pending: number;
        overdue: number;
        quotas: Quota[];
    }>;
}
//# sourceMappingURL=financial.service.d.ts.map