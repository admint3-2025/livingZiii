"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_1 = require("./config/database.config");
const health_controller_1 = require("./health.controller");
const auth_module_1 = require("./modules/auth/auth.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const properties_module_1 = require("./modules/properties/properties.module");
const units_module_1 = require("./modules/units/units.module");
const users_module_1 = require("./modules/users/users.module");
const financial_module_1 = require("./modules/financial/financial.module");
const payment_module_1 = require("./modules/payment/payment.module");
const access_control_module_1 = require("./modules/access-control/access-control.module");
const audit_module_1 = require("./modules/audit/audit.module");
const seed_module_1 = require("./modules/seed/seed.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['../../.env', '.env'],
            }),
            typeorm_1.TypeOrmModule.forRoot((0, database_config_1.getDatabaseConfig)()),
            auth_module_1.AuthModule,
            seed_module_1.SeedModule,
            organizations_module_1.OrganizationsModule,
            properties_module_1.PropertiesModule,
            units_module_1.UnitsModule,
            users_module_1.UsersModule,
            financial_module_1.FinancialModule,
            payment_module_1.PaymentModule,
            access_control_module_1.AccessControlModule,
            audit_module_1.AuditModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map