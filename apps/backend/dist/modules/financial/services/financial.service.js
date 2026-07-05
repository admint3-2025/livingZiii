"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FinancialService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quota_entity_1 = require("../entities/quota.entity");
let FinancialService = FinancialService_1 = class FinancialService {
    constructor(quotasRepository) {
        this.quotasRepository = quotasRepository;
        this.logger = new common_1.Logger(FinancialService_1.name);
    }
    async createQuota(dto) {
        this.logger.log(`Creating quota for unit: ${dto.unitId}`);
        // Generate sequential quota number
        const lastQuota = await this.quotasRepository.findOne({
            where: { propertyId: dto.propertyId },
            order: { createdAt: 'DESC' },
        });
        const nextNumber = (lastQuota?.id ? parseInt(lastQuota.id.substring(0, 1)) + 1 : 1);
        const quotaNumber = `Q-${new Date().getFullYear()}-${String(nextNumber).padStart(2, '0')}`;
        const quota = this.quotasRepository.create({
            ...dto,
            quotaNumber,
            status: quota_entity_1.QuotaStatus.PENDING,
        });
        return this.quotasRepository.save(quota);
    }
    async findQuotasForUnit(unitId) {
        return this.quotasRepository.find({
            where: { unitId },
            order: { dueDate: 'DESC' },
        });
    }
    async findById(id) {
        return this.quotasRepository.findOne({ where: { id } });
    }
    async updateQuota(id, dto) {
        this.logger.log(`Updating quota: ${id}`);
        await this.quotasRepository.update(id, dto);
        return this.findById(id);
    }
    async getStateOfAccount(unitId) {
        const quotas = await this.findQuotasForUnit(unitId);
        const total = quotas.reduce((sum, q) => sum + parseFloat(q.amount.toString()), 0);
        const paid = quotas.reduce((sum, q) => sum + parseFloat(q.paidAmount.toString()), 0);
        const pending = quotas.filter((q) => q.status === quota_entity_1.QuotaStatus.PENDING).length;
        const overdue = quotas.filter((q) => q.status === quota_entity_1.QuotaStatus.OVERDUE).length;
        return {
            total,
            paid,
            pending,
            overdue,
            quotas,
        };
    }
};
exports.FinancialService = FinancialService;
exports.FinancialService = FinancialService = FinancialService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quota_entity_1.Quota)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FinancialService);
//# sourceMappingURL=financial.service.js.map