import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendVisitInvitationEmailDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
