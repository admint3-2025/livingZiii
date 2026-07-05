import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateVisitInvitationDto {
  @IsUUID()
  propertyId: string;

  @IsUUID()
  unitId: string;

  @IsString()
  @MinLength(2)
  visitorName: string;

  @IsOptional()
  @IsString()
  visitorPhone?: string;

  @IsOptional()
  @IsString()
  visitorEmail?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsUUID()
  createdBy: string;

  @IsString()
  accessControlProviderId: string;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDoors?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxEntries?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
