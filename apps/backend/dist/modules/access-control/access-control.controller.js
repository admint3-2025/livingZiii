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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const access_control_service_1 = require("./access-control.service");
const create_access_control_provider_dto_1 = require("./dtos/create-access-control-provider.dto");
const create_visit_invitation_dto_1 = require("./dtos/create-visit-invitation.dto");
const send_visit_invitation_email_dto_1 = require("./dtos/send-visit-invitation-email.dto");
const update_visit_invitation_dto_1 = require("./dtos/update-visit-invitation.dto");
let AccessControlController = class AccessControlController {
    constructor(accessControlService) {
        this.accessControlService = accessControlService;
    }
    async listProviders() {
        return this.accessControlService.listProviders();
    }
    async validateProvider(providerId, dto) {
        return this.accessControlService.validateProvider(providerId, dto);
    }
    async providerStatus(providerId) {
        return this.accessControlService.getProviderStatus(providerId);
    }
    async getDemoContext() {
        return this.accessControlService.getOrCreateDemoContext();
    }
    async createInvitation(dto) {
        return this.accessControlService.createInvitation(dto);
    }
    async findAllInvitations() {
        return this.accessControlService.findAllInvitations();
    }
    async findInvitationById(id) {
        return this.accessControlService.findInvitationById(id);
    }
    async updateInvitation(id, dto) {
        return this.accessControlService.updateInvitation(id, dto);
    }
    async deleteInvitation(id) {
        return this.accessControlService.deleteInvitation(id);
    }
    async shareInvitation(id) {
        const invitation = await this.accessControlService.findInvitationById(id);
        return invitation
            ? {
                id: invitation.id,
                visitorName: invitation.visitorName,
                qrCode: invitation.qrCode,
                shareUrl: `/access-control/share/${invitation.id}`,
            }
            : null;
    }
    async sendInvitationEmail(id, dto) {
        return this.accessControlService.sendInvitationEmail(id, dto);
    }
};
exports.AccessControlController = AccessControlController;
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: 'List registered access control providers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "listProviders", null);
__decorate([
    (0, common_1.Post)('providers/:providerId/validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate access control provider credentials' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_access_control_provider_dto_1.CreateAccessControlProviderDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "validateProvider", null);
__decorate([
    (0, common_1.Get)('providers/:providerId/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider status' }),
    __param(0, (0, common_1.Param)('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "providerStatus", null);
__decorate([
    (0, common_1.Get)('demo-context'),
    (0, swagger_1.ApiOperation)({ summary: 'Get or create demo organization/property/unit/resident for quick temporary visits' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getDemoContext", null);
__decorate([
    (0, common_1.Post)('visit-invitations'),
    (0, swagger_1.ApiOperation)({ summary: 'Create visitor invitation and access pass' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_visit_invitation_dto_1.CreateVisitInvitationDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)('visit-invitations'),
    (0, swagger_1.ApiOperation)({ summary: 'List visitor invitations' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "findAllInvitations", null);
__decorate([
    (0, common_1.Get)('visit-invitations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a visitor invitation' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "findInvitationById", null);
__decorate([
    (0, common_1.Put)('visit-invitations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a visitor invitation' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_visit_invitation_dto_1.UpdateVisitInvitationDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "updateInvitation", null);
__decorate([
    (0, common_1.Delete)('visit-invitations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete visitor invitation and revoke provider pass' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "deleteInvitation", null);
__decorate([
    (0, common_1.Get)('visit-invitations/:id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Get share payload for visitor QR' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "shareInvitation", null);
__decorate([
    (0, common_1.Post)('visit-invitations/:id/send-email'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a visitor invitation by email' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_visit_invitation_email_dto_1.SendVisitInvitationEmailDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "sendInvitationEmail", null);
exports.AccessControlController = AccessControlController = __decorate([
    (0, swagger_1.ApiTags)('Access Control'),
    (0, common_1.Controller)('access-control'),
    __metadata("design:paramtypes", [access_control_service_1.AccessControlService])
], AccessControlController);
//# sourceMappingURL=access-control.controller.js.map