"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
let SeedService = SeedService_1 = class SeedService {
    constructor(organizationsRepository, usersRepository) {
        this.organizationsRepository = organizationsRepository;
        this.usersRepository = usersRepository;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async onModuleInit() {
        if (process.env.NODE_ENV === 'production') {
            return;
        }
        await this.seedDemoData();
    }
    async seedDemoData() {
        let organization = await this.organizationsRepository.findOne({
            where: { name: 'ZIII Living Demo' },
        });
        if (!organization) {
            organization = await this.organizationsRepository.save(this.organizationsRepository.create({
                name: 'ZIII Living Demo',
                description: 'Organización de demostración para desarrollo local',
                email: 'demo@ziii.living',
                country: 'MX',
                status: 'active',
            }));
            this.logger.log(`Organización demo creada: ${organization.id}`);
        }
        const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
        const existingAdmin = await this.usersRepository.findOne({ where: { email: adminEmail } });
        if (!existingAdmin) {
            const password = process.env.SEED_ADMIN_PASSWORD || 'password';
            const hashedPassword = await bcrypt.hash(password, 10);
            await this.usersRepository.save(this.usersRepository.create({
                organizationId: organization.id,
                firstName: 'Admin',
                lastName: 'ZIII',
                email: adminEmail,
                phone: '+520000000000',
                password: hashedPassword,
                role: user_entity_1.UserRole.ADMIN,
                permissions: [],
                emailVerified: true,
                status: 'active',
            }));
            this.logger.log(`Usuario admin demo creado: ${adminEmail}`);
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map