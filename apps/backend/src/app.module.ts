import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '@/config/database.config';
import { HealthController } from '@/health.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { PropertiesModule } from '@/modules/properties/properties.module';
import { UnitsModule } from '@/modules/units/units.module';
import { UsersModule } from '@/modules/users/users.module';
import { FinancialModule } from '@/modules/financial/financial.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { AccessControlModule } from '@/modules/access-control/access-control.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { SeedModule } from '@/modules/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    SeedModule,
    OrganizationsModule,
    PropertiesModule,
    UnitsModule,
    UsersModule,
    FinancialModule,
    PaymentModule,
    AccessControlModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
