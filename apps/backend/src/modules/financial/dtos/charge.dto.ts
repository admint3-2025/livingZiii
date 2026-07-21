import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ChargeStatus, ChargeType } from '@/modules/financial/entities/charge.entity';

export class CreateChargeDto {
  @IsUUID()
  unitId!: string;

  @IsEnum(ChargeType)
  type!: ChargeType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsDate()
  @Type(() => Date)
  dueDate!: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  relatedQuotaId?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateChargeDto {
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ListChargesQueryDto {
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;

  @IsOptional()
  @IsEnum(ChargeType)
  type?: ChargeType;
}
