import { IsString, IsNumber, IsDate, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { QuotaType } from '../entities/quota.entity';

export class CreateQuotaDto {
  @IsUUID()
  unitId: string;

  @IsUUID()
  propertyId: string;

  @IsEnum(QuotaType)
  type: QuotaType;

  @IsNumber()
  amount: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateQuotaDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;
}

export class StateOfAccountDto {
  @IsUUID()
  unitId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}
