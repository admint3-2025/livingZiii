"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const access_control_controller_1 = require("./access-control.controller");
const access_control_service_1 = require("./access-control.service");
const access_event_entity_1 = require("./entities/access-event.entity");
const visit_invitation_entity_1 = require("./entities/visit-invitation.entity");
const access_control_provider_factory_1 = require("../../providers/access-control-provider.factory");
const hikvision_access_control_provider_1 = require("../../providers/hikvision-access-control.provider");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const property_entity_1 = require("../properties/entities/property.entity");
const unit_entity_1 = require("../units/entities/unit.entity");
const user_entity_1 = require("../users/entities/user.entity");
let AccessControlModule = class AccessControlModule {
};
exports.AccessControlModule = AccessControlModule;
exports.AccessControlModule = AccessControlModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([visit_invitation_entity_1.VisitInvitation, access_event_entity_1.AccessEvent, organization_entity_1.Organization, property_entity_1.Property, unit_entity_1.Unit, user_entity_1.User])],
        controllers: [access_control_controller_1.AccessControlController],
        providers: [
            access_control_service_1.AccessControlService,
            access_control_provider_factory_1.AccessControlProviderFactoryService,
            hikvision_access_control_provider_1.HikvisionAccessControlProvider,
            {
                provide: 'ACCESS_CONTROL_PROVIDER_BOOTSTRAP',
                inject: [access_control_provider_factory_1.AccessControlProviderFactoryService, hikvision_access_control_provider_1.HikvisionAccessControlProvider],
                useFactory: (factory, hikvision) => {
                    factory.register(hikvision);
                    return true;
                },
            },
        ],
        exports: [access_control_service_1.AccessControlService, access_control_provider_factory_1.AccessControlProviderFactoryService, hikvision_access_control_provider_1.HikvisionAccessControlProvider],
    })
], AccessControlModule);
//# sourceMappingURL=access-control.module.js.map