import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentRecordStatus } from '@/modules/financial/entities/payment-record.entity';

export class CreateManualPaymentDto {
  @IsUUID()
  unitId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  paymentProviderId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  providerResponse?: Record<string, any>;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class ProcessPaymentWebhookDto {
  @IsString()
  transactionId!: string;

  @IsOptional()
  @IsString()
  paymentProviderId?: string;

  @IsEnum(PaymentRecordStatus)
  status!: PaymentRecordStatus;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  amount?: number;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  payload?: Record<string, any>;
}

export class ListPaymentsQueryDto {
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsEnum(PaymentRecordStatus)
  status?: PaymentRecordStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}
