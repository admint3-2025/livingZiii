import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialService } from './services/financial.service';
import { FinancialController } from './controllers/financial.controller';
import { Quota } from './entities/quota.entity';
import { Charge } from './entities/charge.entity';
import { PaymentRecord } from './entities/payment-record.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
import { Property } from '@/modules/properties/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quota, Charge, PaymentRecord, Unit, Property])],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [TypeOrmModule, FinancialService],
})
export class FinancialModule {}
