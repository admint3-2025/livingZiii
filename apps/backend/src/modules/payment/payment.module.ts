import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { FinancialModule } from '@/modules/financial/financial.module';
import { PaymentRecord } from '@/modules/financial/entities/payment-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRecord]), FinancialModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
