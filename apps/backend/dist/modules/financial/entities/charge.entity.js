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
exports.Charge = exports.ChargeStatus = exports.ChargeType = void 0;
const typeorm_1 = require("typeorm");
const unit_entity_1 = require("../../units/entities/unit.entity");
var ChargeType;
(function (ChargeType) {
    ChargeType["FINE"] = "fine";
    ChargeType["INTEREST"] = "interest";
    ChargeType["SERVICE"] = "service";
    ChargeType["OTHER"] = "other";
})(ChargeType || (exports.ChargeType = ChargeType = {}));
var ChargeStatus;
(function (ChargeStatus) {
    ChargeStatus["PENDING"] = "pending";
    ChargeStatus["PAID"] = "paid";
    ChargeStatus["CANCELLED"] = "cancelled";
    ChargeStatus["WAIVED"] = "waived";
})(ChargeStatus || (exports.ChargeStatus = ChargeStatus = {}));
let Charge = class Charge {
};
exports.Charge = Charge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Charge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Charge.prototype, "unitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'unitId' }),
    __metadata("design:type", unit_entity_1.Unit)
], Charge.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: ChargeType.OTHER }),
    __metadata("design:type", String)
], Charge.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Charge.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Charge.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: ChargeStatus.PENDING }),
    __metadata("design:type", String)
], Charge.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Charge.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Charge.prototype, "relatedQuotaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Charge.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Charge.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Charge.prototype, "createdAt", void 0);
exports.Charge = Charge = __decorate([
    (0, typeorm_1.Entity)('charges')
], Charge);
//# sourceMappingURL=charge.entity.js.map