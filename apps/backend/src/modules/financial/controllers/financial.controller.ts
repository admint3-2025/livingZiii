import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinancialService } from '@/modules/financial/services/financial.service';
import {
  CreateBulkMonthlyQuotaDto,
  CreateQuotaDto,
  ListQuotasQueryDto,
  UpdateQuotaDto,
} from '@/modules/financial/dtos/quota.dto';
import { CreateChargeDto, ListChargesQueryDto, UpdateChargeDto } from '@/modules/financial/dtos/charge.dto';

@ApiTags('Financial')
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('quotas')
  @ApiOperation({ summary: 'Create a quota for a unit' })
  async createQuota(@Body() dto: CreateQuotaDto) {
    return this.financialService.createQuota(dto);
  }

  @Post('quotas/bulk-monthly')
  @ApiOperation({ summary: 'Create monthly quotas for multiple units' })
  async createBulkMonthlyQuotas(@Body() dto: CreateBulkMonthlyQuotaDto) {
    return this.financialService.createBulkMonthlyQuotas(dto);
  }

  @Get('quotas')
  @ApiOperation({ summary: 'List quotas with filters' })
  async listQuotas(@Query() query: ListQuotasQueryDto) {
    return this.financialService.listQuotas(query);
  }

  @Get('quotas/:id')
  @ApiOperation({ summary: 'Get quota by ID' })
  async getQuotaById(@Param('id') id: string) {
    return this.financialService.findQuotaById(id);
  }

  @Patch('quotas/:id')
  @ApiOperation({ summary: 'Update quota' })
  async updateQuota(@Param('id') id: string, @Body() dto: UpdateQuotaDto) {
    return this.financialService.updateQuota(id, dto);
  }

  @Post('charges')
  @ApiOperation({ summary: 'Create an additional charge (fine/interest/service)' })
  async createCharge(@Body() dto: CreateChargeDto) {
    return this.financialService.createCharge(dto);
  }

  @Get('charges')
  @ApiOperation({ summary: 'List charges with filters' })
  async listCharges(@Query() query: ListChargesQueryDto) {
    return this.financialService.listCharges(query);
  }

  @Patch('charges/:id')
  @ApiOperation({ summary: 'Update charge' })
  async updateCharge(@Param('id') id: string, @Body() dto: UpdateChargeDto) {
    return this.financialService.updateCharge(id, dto);
  }

  @Get('state-of-account/:unitId')
  @ApiOperation({ summary: 'Get state of account for a unit' })
  async getStateOfAccount(@Param('unitId') unitId: string) {
    return this.financialService.getStateOfAccount(unitId);
  }
}
