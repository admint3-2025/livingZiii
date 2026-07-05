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
var OrganizationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const organization_entity_1 = require("../entities/organization.entity");
let OrganizationsService = OrganizationsService_1 = class OrganizationsService {
    constructor(organizationsRepository) {
        this.organizationsRepository = organizationsRepository;
        this.logger = new common_1.Logger(OrganizationsService_1.name);
    }
    async create(dto) {
        this.logger.log(`Creating organization: ${dto.name}`);
        const organization = this.organizationsRepository.create(dto);
        return this.organizationsRepository.save(organization);
    }
    async findAll() {
        return this.organizationsRepository.find();
    }
    async findById(id) {
        return this.organizationsRepository.findOne({ where: { id } });
    }
    async update(id, dto) {
        this.logger.log(`Updating organization: ${id}`);
        await this.organizationsRepository.update(id, dto);
        return this.findById(id);
    }
    async remove(id) {
        this.logger.log(`Removing organization: ${id}`);
        await this.organizationsRepository.delete(id);
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = OrganizationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map