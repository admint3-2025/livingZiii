import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from '@/modules/payment/services/payment.service';
import { CreateManualPaymentDto, ListPaymentsQueryDto, ProcessPaymentWebhookDto } from '@/modules/payment/dtos/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('manual')
  @ApiOperation({ summary: 'Register and reconcile a manual payment' })
  async createManualPayment(@Body() dto: CreateManualPaymentDto) {
    return this.paymentService.createManualPayment(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payment records' })
  async listPayments(@Query() query: ListPaymentsQueryDto) {
    return this.paymentService.listPayments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment record by ID' })
  async findById(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Process provider webhook and reconcile payment status' })
  async processWebhook(@Body() dto: ProcessPaymentWebhookDto) {
    return this.paymentService.processWebhook(dto);
  }
}
