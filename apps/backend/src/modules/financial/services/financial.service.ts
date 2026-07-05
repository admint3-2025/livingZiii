import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quota, QuotaStatus } from '../entities/quota.entity';
import { CreateQuotaDto, UpdateQuotaDto } from '../dtos/quota.dto';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    @InjectRepository(Quota)
    private quotasRepository: Repository<Quota>,
  ) {}

  async createQuota(dto: CreateQuotaDto): Promise<Quota> {
    this.logger.log(`Creating quota for unit: ${dto.unitId}`);

    // Generate sequential quota number
    const lastQuota = await this.quotasRepository.findOne({
      where: { propertyId: dto.propertyId },
      order: { createdAt: 'DESC' },
    });

    const nextNumber = (lastQuota?.id ? parseInt(lastQuota.id.substring(0, 1)) + 1 : 1);
    const quotaNumber = `Q-${new Date().getFullYear()}-${String(nextNumber).padStart(2, '0')}`;

    const quota = this.quotasRepository.create({
      ...dto,
      quotaNumber,
      status: QuotaStatus.PENDING,
    });

    return this.quotasRepository.save(quota);
  }

  async findQuotasForUnit(unitId: string): Promise<Quota[]> {
    return this.quotasRepository.find({
      where: { unitId },
      order: { dueDate: 'DESC' },
    });
  }

  async findById(id: string): Promise<Quota | null> {
    return this.quotasRepository.findOne({ where: { id } });
  }

  async updateQuota(id: string, dto: UpdateQuotaDto): Promise<Quota | null> {
    this.logger.log(`Updating quota: ${id}`);

    await this.quotasRepository.update(id, dto);
    return this.findById(id);
  }

  async getStateOfAccount(unitId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    quotas: Quota[];
  }> {
    const quotas = await this.findQuotasForUnit(unitId);

    const total = quotas.reduce((sum, q) => sum + parseFloat(q.amount.toString()), 0);
    const paid = quotas.reduce((sum, q) => sum + parseFloat(q.paidAmount.toString()), 0);
    const pending = quotas.filter((q) => q.status === QuotaStatus.PENDING).length;
    const overdue = quotas.filter((q) => q.status === QuotaStatus.OVERDUE).length;

    return {
      total,
      paid,
      pending,
      overdue,
      quotas,
    };
  }
}
