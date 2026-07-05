import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateVisitInvitationDto {
  @IsOptional()
  @IsString()
  status?: 'pending' | 'approved' | 'rejected' | 'used' | 'expired' | 'revoked';

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  accessControlPassId?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
