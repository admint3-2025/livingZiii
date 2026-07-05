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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRecord = exports.PaymentRecordStatus = void 0;
const typeorm_1 = require("typeorm");
const unit_entity_1 = require("../../units/entities/unit.entity");
var PaymentRecordStatus;
(function (PaymentRecordStatus) {
    PaymentRecordStatus["PENDING"] = "pending";
    PaymentRecordStatus["PROCESSING"] = "processing";
    PaymentRecordStatus["APPROVED"] = "approved";
    PaymentRecordStatus["FAILED"] = "failed";
    PaymentRecordStatus["REFUNDED"] = "refunded";
})(PaymentRecordStatus || (exports.PaymentRecordStatus = PaymentRecordStatus = {}));
let PaymentRecord = class PaymentRecord {
};
exports.PaymentRecord = PaymentRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaymentRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'unitId' }),
    __metadata("design:type", unit_entity_1.Unit)
], PaymentRecord.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PaymentRecord.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'MXN' }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "paymentProviderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: PaymentRecordStatus.PENDING }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], PaymentRecord.prototype, "appliedToQuotaIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], PaymentRecord.prototype, "providerResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PaymentRecord.prototype, "receiptUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentRecord.prototype, "createdAt", void 0);
exports.PaymentRecord = PaymentRecord = __decorate([
    (0, typeorm_1.Entity)('payment_records')
], PaymentRecord);
//# sourceMappingURL=payment-record.entity.js.map