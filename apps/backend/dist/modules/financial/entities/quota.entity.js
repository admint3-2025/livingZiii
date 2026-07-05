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
exports.Quota = exports.QuotaStatus = exports.QuotaType = void 0;
const typeorm_1 = require("typeorm");
const unit_entity_1 = require("../../units/entities/unit.entity");
const property_entity_1 = require("../../properties/entities/property.entity");
var QuotaType;
(function (QuotaType) {
    QuotaType["ORDINARY"] = "ordinary";
    QuotaType["EXTRAORDINARY"] = "extraordinary";
})(QuotaType || (exports.QuotaType = QuotaType = {}));
var QuotaStatus;
(function (QuotaStatus) {
    QuotaStatus["PENDING"] = "pending";
    QuotaStatus["PARTIAL"] = "partial";
    QuotaStatus["PAID"] = "paid";
    QuotaStatus["OVERDUE"] = "overdue";
    QuotaStatus["CANCELLED"] = "cancelled";
})(QuotaStatus || (exports.QuotaStatus = QuotaStatus = {}));
let Quota = class Quota {
};
exports.Quota = Quota;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Quota.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Quota.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'unitId' }),
    __metadata("design:type", unit_entity_1.Unit)
], Quota.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Quota.prototype, "propertyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'propertyId' }),
    __metadata("design:type", property_entity_1.Property)
], Quota.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Quota.prototype, "quotaNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: QuotaType.ORDINARY }),
    __metadata("design:type", String)
], Quota.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Quota.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Quota.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Quota.prototype, "paymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quota.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: QuotaStatus.PENDING }),
    __metadata("design:type", String)
], Quota.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Quota.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Quota.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Quota.prototype, "createdAt", void 0);
exports.Quota = Quota = __decorate([
    (0, typeorm_1.Entity)('quotas')
], Quota);
//# sourceMappingURL=quota.entity.js.map