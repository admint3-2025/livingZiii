import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAccessControlProviderDto {
  @IsString()
  providerId: string;

  @IsString()
  host: string;

  @IsNumber()
  @Min(1)
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  protocol?: 'http' | 'https';

  @IsOptional()
  @IsString()
  integrationMode?: 'device' | 'team';

  @IsOptional()
  @IsString()
  appKey?: string;

  @IsOptional()
  @IsString()
  appSecret?: string;

  @IsOptional()
  @IsString()
  openApiBaseUrl?: string;

  @IsOptional()
  @IsString()
  teamAccount?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  communityId?: string;

  @IsOptional()
  @IsString()
  buildingId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  defaultAccessGroupId?: string;

  @IsOptional()
  @IsString()
  visitorQrEndpoint?: string;

  @IsOptional()
  @IsString()
  visitorRevokeEndpoint?: string;
}
