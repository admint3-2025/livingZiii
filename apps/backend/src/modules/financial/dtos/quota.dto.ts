import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { QuotaStatus, QuotaType } from '../entities/quota.entity';

export class CreateQuotaDto {
  @IsUUID()
  unitId!: string;

  @IsUUID()
  propertyId!: string;

  @IsEnum(QuotaType)
  type!: QuotaType;

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
  metadata?: Record<string, any>;
}

export class UpdateQuotaDto {
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
  @IsEnum(QuotaStatus)
  status?: QuotaStatus;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class StateOfAccountDto {
  @IsUUID()
  unitId!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}

export class CreateBulkMonthlyQuotaDto {
  @IsUUID()
  propertyId!: string;

  @IsOptional()
  @IsEnum(QuotaType)
  type?: QuotaType;

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
  @IsUUID('4', { each: true })
  unitIds?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ListQuotasQueryDto {
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsEnum(QuotaStatus)
  status?: QuotaStatus;

  @IsOptional()
  @IsEnum(QuotaType)
  type?: QuotaType;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDateTo?: Date;
}
