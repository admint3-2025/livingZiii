import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, MoreThanOrEqual, Repository } from 'typeorm';
import { FinancialService } from '@/modules/financial/services/financial.service';
import { PaymentRecord, PaymentRecordStatus } from '@/modules/financial/entities/payment-record.entity';
import { CreateManualPaymentDto, ListPaymentsQueryDto, ProcessPaymentWebhookDto } from '@/modules/payment/dtos/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly financialService: FinancialService,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordsRepository: Repository<PaymentRecord>,
  ) {}

  async createManualPayment(dto: CreateManualPaymentDto) {
    return this.financialService.registerAndApplyPayment({
      unitId: dto.unitId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      currency: dto.currency,
      description: dto.description,
      paymentProviderId: dto.paymentProviderId,
      transactionId: dto.transactionId,
      providerResponse: dto.providerResponse,
      receiptUrl: dto.receiptUrl,
    });
  }

  async listPayments(query: ListPaymentsQueryDto): Promise<PaymentRecord[]> {
    const where: FindOptionsWhere<PaymentRecord> = {};

    if (query.unitId) {
      where.unitId = query.unitId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = Between(query.fromDate, query.toDate);
    } else if (query.fromDate) {
      where.createdAt = MoreThanOrEqual(query.fromDate);
    }

    return this.paymentRecordsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<PaymentRecord> {
    const record = await this.paymentRecordsRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Registro de pago no encontrado');
    }
    return record;
  }

  async processWebhook(dto: ProcessPaymentWebhookDto): Promise<PaymentRecord> {
    const existing = await this.paymentRecordsRepository.findOne({
      where: {
        transactionId: dto.transactionId,
        paymentProviderId: dto.paymentProviderId,
      },
    });

    if (!existing) {
      if (dto.status !== PaymentRecordStatus.APPROVED || !dto.unitId || !dto.amount) {
        throw new NotFoundException('No existe pago para actualizar y faltan datos para conciliar');
      }

      const result = await this.financialService.registerAndApplyPayment({
        unitId: dto.unitId,
        amount: dto.amount,
        paymentMethod: 'provider_webhook',
        transactionId: dto.transactionId,
        paymentProviderId: dto.paymentProviderId,
        providerResponse: dto.payload,
        description: 'Pago confirmado por webhook',
      });

      return result.paymentRecord;
    }

    if (existing.status === PaymentRecordStatus.APPROVED) {
      return existing;
    }

    existing.status = dto.status;
    existing.providerResponse = {
      ...(existing.providerResponse ?? {}),
      webhook: dto.payload,
      webhookStatus: dto.status,
      webhookAt: new Date().toISOString(),
    };

    if (dto.status !== PaymentRecordStatus.APPROVED) {
      return this.paymentRecordsRepository.save(existing);
    }

    const amount = Number(existing.amount);
    if (amount <= 0 || !existing.unitId) {
      throw new NotFoundException('Pago invalido para conciliar');
    }

    const reconciliation = await this.financialService.reconcilePaymentAmount(existing.unitId, amount);

    existing.appliedToQuotaIds = reconciliation.appliedToQuotaIds;
    existing.providerResponse = {
      ...(existing.providerResponse ?? {}),
      appliedQuotas: reconciliation.appliedQuotas,
      unappliedAmount: reconciliation.unappliedAmount,
    };

    return this.paymentRecordsRepository.save(existing);
  }
}
