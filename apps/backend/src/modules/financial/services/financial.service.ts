import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, In, LessThan, Repository } from 'typeorm';
import { Quota, QuotaStatus, QuotaType } from '../entities/quota.entity';
import { Charge, ChargeStatus } from '../entities/charge.entity';
import { PaymentRecord, PaymentRecordStatus } from '../entities/payment-record.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
import { Property } from '@/modules/properties/entities/property.entity';
import {
  CreateBulkMonthlyQuotaDto,
  CreateQuotaDto,
  ListQuotasQueryDto,
  UpdateQuotaDto,
} from '../dtos/quota.dto';
import { CreateChargeDto, ListChargesQueryDto, UpdateChargeDto } from '../dtos/charge.dto';

type ApplyPaymentInput = {
  unitId: string;
  amount: number;
  paymentMethod: string;
  currency?: string;
  description?: string;
  paymentProviderId?: string;
  transactionId?: string;
  providerResponse?: Record<string, any>;
  receiptUrl?: string;
};

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    @InjectRepository(Quota)
    private readonly quotasRepository: Repository<Quota>,
    @InjectRepository(Charge)
    private readonly chargesRepository: Repository<Charge>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordsRepository: Repository<PaymentRecord>,
    @InjectRepository(Unit)
    private readonly unitsRepository: Repository<Unit>,
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    private readonly dataSource: DataSource,
  ) {}

  async createQuota(dto: CreateQuotaDto): Promise<Quota> {
    this.logger.log(`Creating quota for unit: ${dto.unitId}`);

    await this.assertUnitExists(dto.unitId);
    await this.assertPropertyExists(dto.propertyId);

    const quotaNumber = await this.generateQuotaNumber(dto.propertyId, dto.dueDate);

    const quota = this.quotasRepository.create({
      ...dto,
      quotaNumber,
      status: this.isOverdue(dto.dueDate) ? QuotaStatus.OVERDUE : QuotaStatus.PENDING,
      paidAmount: 0,
    });

    return this.quotasRepository.save(quota);
  }

  async createBulkMonthlyQuotas(dto: CreateBulkMonthlyQuotaDto): Promise<Quota[]> {
    this.logger.log(`Creating bulk monthly quotas for property: ${dto.propertyId}`);

    await this.assertPropertyExists(dto.propertyId);

    const targetUnits = dto.unitIds?.length
      ? await this.unitsRepository.find({
          where: { propertyId: dto.propertyId, id: In(dto.unitIds) },
          order: { unitNumber: 'ASC' },
        })
      : await this.unitsRepository.find({
          where: { propertyId: dto.propertyId },
          order: { unitNumber: 'ASC' },
        });

    if (targetUnits.length === 0) {
      return [];
    }

    const createdQuotas: Quota[] = [];
    for (const unit of targetUnits) {
      const quota = await this.createQuota({
        unitId: unit.id,
        propertyId: dto.propertyId,
        type: dto.type ?? QuotaType.ORDINARY,
        amount: dto.amount,
        dueDate: dto.dueDate,
        description: dto.description,
        metadata: dto.metadata,
      });
      createdQuotas.push(quota);
    }

    return createdQuotas;
  }

  async listQuotas(query: ListQuotasQueryDto): Promise<Quota[]> {
    await this.refreshOverdueQuotas(query.unitId);

    const where: FindOptionsWhere<Quota> = {};
    if (query.unitId) {
      where.unitId = query.unitId;
    }
    if (query.propertyId) {
      where.propertyId = query.propertyId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    const queryBuilder = this.quotasRepository.createQueryBuilder('quota').where(where);

    if (query.dueDateFrom) {
      queryBuilder.andWhere('quota.dueDate >= :dueDateFrom', { dueDateFrom: query.dueDateFrom });
    }
    if (query.dueDateTo) {
      queryBuilder.andWhere('quota.dueDate <= :dueDateTo', { dueDateTo: query.dueDateTo });
    }

    return queryBuilder.orderBy('quota.dueDate', 'DESC').addOrderBy('quota.createdAt', 'DESC').getMany();
  }

  async findQuotaById(id: string): Promise<Quota> {
    const quota = await this.quotasRepository.findOne({ where: { id } });
    if (!quota) {
      throw new NotFoundException('Cuota no encontrada');
    }
    return quota;
  }

  async updateQuota(id: string, dto: UpdateQuotaDto): Promise<Quota> {
    this.logger.log(`Updating quota: ${id}`);

    await this.findQuotaById(id);
    await this.quotasRepository.update(id, dto);
    return this.findQuotaById(id);
  }

  async createCharge(dto: CreateChargeDto): Promise<Charge> {
    this.logger.log(`Creating charge for unit: ${dto.unitId}`);
    await this.assertUnitExists(dto.unitId);

    const charge = this.chargesRepository.create({
      ...dto,
      status: ChargeStatus.PENDING,
    });

    return this.chargesRepository.save(charge);
  }

  async listCharges(query: ListChargesQueryDto): Promise<Charge[]> {
    const where: FindOptionsWhere<Charge> = {};
    if (query.unitId) {
      where.unitId = query.unitId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    return this.chargesRepository.find({
      where,
      order: { dueDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateCharge(id: string, dto: UpdateChargeDto): Promise<Charge> {
    const existing = await this.chargesRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Cargo no encontrado');
    }

    await this.chargesRepository.update(id, dto);

    const updated = await this.chargesRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException('Cargo no encontrado');
    }
    return updated;
  }

  async listPaymentRecords(unitId?: string): Promise<PaymentRecord[]> {
    const where: FindOptionsWhere<PaymentRecord> = {};
    if (unitId) {
      where.unitId = unitId;
    }

    return this.paymentRecordsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findPaymentRecordById(id: string): Promise<PaymentRecord> {
    const record = await this.paymentRecordsRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Registro de pago no encontrado');
    }
    return record;
  }

  async registerAndApplyPayment(input: ApplyPaymentInput): Promise<{
    paymentRecord: PaymentRecord;
    appliedQuotas: Array<{ quotaId: string; appliedAmount: number; remainingAfterApply: number }>;
    unappliedAmount: number;
  }> {
    this.logger.log(`Applying payment for unit ${input.unitId}, amount ${input.amount}`);

    if (input.amount <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a cero');
    }

    await this.assertUnitExists(input.unitId);

    return this.dataSource.transaction(async (manager) => {
      const quotaApply = await this.applyPaymentToOpenQuotas(manager, input.unitId, input.amount);
      const paymentRepo = manager.getRepository(PaymentRecord);

      const paymentRecord = paymentRepo.create({
        unitId: input.unitId,
        amount: Number(input.amount.toFixed(2)),
        currency: input.currency ?? 'MXN',
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId,
        paymentProviderId: input.paymentProviderId,
        status: PaymentRecordStatus.APPROVED,
        description: input.description,
        providerResponse: {
          ...(input.providerResponse ?? {}),
          appliedQuotas: quotaApply.appliedQuotas,
          unappliedAmount: quotaApply.unappliedAmount,
        },
        appliedToQuotaIds: quotaApply.appliedToQuotaIds,
        receiptUrl: input.receiptUrl,
      });

      const saved = await paymentRepo.save(paymentRecord);

      return {
        paymentRecord: saved,
        appliedQuotas: quotaApply.appliedQuotas,
        unappliedAmount: quotaApply.unappliedAmount,
      };
    });
  }

  async reconcilePaymentAmount(unitId: string, amount: number): Promise<{
    appliedQuotas: Array<{ quotaId: string; appliedAmount: number; remainingAfterApply: number }>;
    appliedToQuotaIds: string[];
    unappliedAmount: number;
  }> {
    if (amount <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a cero');
    }

    await this.assertUnitExists(unitId);

    return this.dataSource.transaction(async (manager) => {
      return this.applyPaymentToOpenQuotas(manager, unitId, amount);
    });
  }

  async getStateOfAccount(unitId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    pendingCount: number;
    overdueCount: number;
    quotas: Quota[];
  }> {
    await this.assertUnitExists(unitId);
    await this.refreshOverdueQuotas(unitId);

    const quotas = await this.quotasRepository.find({
      where: { unitId },
      order: { dueDate: 'DESC', createdAt: 'DESC' },
    });

    const total = quotas.reduce((sum, q) => sum + Number(q.amount), 0);
    const paid = quotas.reduce((sum, q) => sum + Number(q.paidAmount), 0);
    const pending = quotas.reduce((sum, q) => sum + Math.max(Number(q.amount) - Number(q.paidAmount), 0), 0);
    const overdue = quotas
      .filter((q) => q.status === QuotaStatus.OVERDUE)
      .reduce((sum, q) => sum + Math.max(Number(q.amount) - Number(q.paidAmount), 0), 0);

    const pendingCount = quotas.filter((q) => q.status === QuotaStatus.PENDING || q.status === QuotaStatus.PARTIAL).length;
    const overdueCount = quotas.filter((q) => q.status === QuotaStatus.OVERDUE).length;

    return {
      total: Number(total.toFixed(2)),
      paid: Number(paid.toFixed(2)),
      pending: Number(pending.toFixed(2)),
      overdue: Number(overdue.toFixed(2)),
      pendingCount,
      overdueCount,
      quotas,
    };
  }

  private async applyPaymentToOpenQuotas(
    manager: EntityManager,
    unitId: string,
    amount: number,
  ): Promise<{
    appliedQuotas: Array<{ quotaId: string; appliedAmount: number; remainingAfterApply: number }>;
    appliedToQuotaIds: string[];
    unappliedAmount: number;
  }> {
    const quotaRepo = manager.getRepository(Quota);

    await this.refreshOverdueQuotas(unitId, manager);

    const openQuotas = await quotaRepo.find({
      where: [
        { unitId, status: QuotaStatus.PENDING },
        { unitId, status: QuotaStatus.PARTIAL },
        { unitId, status: QuotaStatus.OVERDUE },
      ],
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });

    let remaining = Number(amount.toFixed(2));
    const appliedQuotas: Array<{ quotaId: string; appliedAmount: number; remainingAfterApply: number }> = [];
    const appliedToQuotaIds: string[] = [];

    for (const quota of openQuotas) {
      if (remaining <= 0) {
        break;
      }

      const quotaAmount = Number(quota.amount);
      const alreadyPaid = Number(quota.paidAmount);
      const pendingForQuota = Number((quotaAmount - alreadyPaid).toFixed(2));

      if (pendingForQuota <= 0) {
        continue;
      }

      const appliedAmount = Number(Math.min(remaining, pendingForQuota).toFixed(2));
      const newPaidAmount = Number((alreadyPaid + appliedAmount).toFixed(2));
      const isFullyPaid = newPaidAmount >= quotaAmount;

      quota.paidAmount = newPaidAmount;
      quota.status = isFullyPaid
        ? QuotaStatus.PAID
        : this.isOverdue(quota.dueDate)
          ? QuotaStatus.OVERDUE
          : QuotaStatus.PARTIAL;
      quota.paymentDate = isFullyPaid ? new Date() : quota.paymentDate;

      await quotaRepo.save(quota);

      remaining = Number((remaining - appliedAmount).toFixed(2));
      appliedToQuotaIds.push(quota.id);
      appliedQuotas.push({
        quotaId: quota.id,
        appliedAmount,
        remainingAfterApply: remaining,
      });
    }

    return {
      appliedQuotas,
      appliedToQuotaIds,
      unappliedAmount: remaining,
    };
  }

  private async generateQuotaNumber(propertyId: string, dueDate: Date): Promise<string> {
    const year = dueDate.getFullYear();
    const prefix = `Q-${year}-`;

    const [latest] = await this.quotasRepository
      .createQueryBuilder('quota')
      .where('quota.propertyId = :propertyId', { propertyId })
      .andWhere('quota.quotaNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('quota.createdAt', 'DESC')
      .limit(1)
      .getMany();

    const lastSequence = latest?.quotaNumber ? Number(latest.quotaNumber.split('-').pop()) : 0;
    const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }

  private async refreshOverdueQuotas(unitId?: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Quota) : this.quotasRepository;

    const where: FindOptionsWhere<Quota> = {
      dueDate: LessThan(new Date()),
      status: QuotaStatus.PENDING,
    };

    if (unitId) {
      where.unitId = unitId;
    }

    await repo.update(where, { status: QuotaStatus.OVERDUE });

    const partialWhere: FindOptionsWhere<Quota> = {
      dueDate: LessThan(new Date()),
      status: QuotaStatus.PARTIAL,
    };

    if (unitId) {
      partialWhere.unitId = unitId;
    }

    await repo.update(partialWhere, { status: QuotaStatus.OVERDUE });
  }

  private isOverdue(dueDate: Date): boolean {
    return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  private async assertUnitExists(unitId: string): Promise<void> {
    const unit = await this.unitsRepository.findOne({ where: { id: unitId } });
    if (!unit) {
      throw new NotFoundException('Unidad no encontrada');
    }
  }

  private async assertPropertyExists(propertyId: string): Promise<void> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }
  }
}
