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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AccessControlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const access_control_provider_factory_1 = require("../../providers/access-control-provider.factory");
const hikvision_access_control_provider_1 = require("../../providers/hikvision-access-control.provider");
const access_event_entity_1 = require("./entities/access-event.entity");
const visit_invitation_entity_1 = require("./entities/visit-invitation.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const property_entity_1 = require("../properties/entities/property.entity");
const unit_entity_1 = require("../units/entities/unit.entity");
const user_entity_1 = require("../users/entities/user.entity");
const visit_invitation_email_util_1 = require("./utils/visit-invitation-email.util");
let AccessControlService = AccessControlService_1 = class AccessControlService {
    constructor(visitInvitationsRepository, accessEventsRepository, organizationsRepository, propertiesRepository, unitsRepository, usersRepository, providerFactory, hikvisionProvider) {
        this.visitInvitationsRepository = visitInvitationsRepository;
        this.accessEventsRepository = accessEventsRepository;
        this.organizationsRepository = organizationsRepository;
        this.propertiesRepository = propertiesRepository;
        this.unitsRepository = unitsRepository;
        this.usersRepository = usersRepository;
        this.providerFactory = providerFactory;
        this.hikvisionProvider = hikvisionProvider;
        this.logger = new common_1.Logger(AccessControlService_1.name);
    }
    async listProviders() {
        return this.providerFactory.list().map((provider) => ({
            id: provider.id,
            name: provider.name,
        }));
    }
    async validateProvider(providerId, config) {
        const provider = this.requireProvider(providerId);
        return provider.validateCredentials(config);
    }
    async getProviderStatus(providerId) {
        const provider = this.requireProvider(providerId);
        return provider.getStatus();
    }
    async getOrCreateDemoContext() {
        let organization = await this.organizationsRepository.findOne({
            where: { name: 'ZIII Living Demo' },
        });
        if (!organization) {
            organization = await this.organizationsRepository.save(this.organizationsRepository.create({
                name: 'ZIII Living Demo',
                description: 'Organizacion local para pruebas rapidas de acceso temporal',
                email: 'demo@ziii.living',
                country: 'MX',
                status: 'active',
            }));
        }
        let property = await this.propertiesRepository.findOne({
            where: {
                organizationId: organization.id,
                name: 'ZIII Torre Demo',
            },
        });
        if (!property) {
            property = await this.propertiesRepository.save(this.propertiesRepository.create({
                organizationId: organization.id,
                name: 'ZIII Torre Demo',
                description: 'Propiedad de prueba para visitas temporales',
                address: 'Acceso principal demo',
                city: 'Monterrey',
                state: 'Nuevo Leon',
                propertyType: 'condominium',
                totalUnits: 1,
                accessControlProviderId: 'hikvision',
                status: 'active',
            }));
        }
        let unit = await this.unitsRepository.findOne({
            where: {
                propertyId: property.id,
                unitNumber: 'A-101',
            },
        });
        if (!unit) {
            unit = await this.unitsRepository.save(this.unitsRepository.create({
                propertyId: property.id,
                unitNumber: 'A-101',
                description: 'Unidad demo para pruebas de acceso',
                bedroomCount: 2,
                area: 85,
                status: 'occupied',
            }));
        }
        if (property.totalUnits !== 1) {
            property.totalUnits = 1;
            await this.propertiesRepository.save(property);
        }
        const residentEmail = 'residente.demo@ziii.living';
        let resident = await this.usersRepository.findOne({
            where: { email: residentEmail },
        });
        if (!resident) {
            resident = await this.usersRepository.save(this.usersRepository.create({
                organizationId: organization.id,
                unitId: unit.id,
                firstName: 'Residente',
                lastName: 'Demo',
                email: residentEmail,
                phone: '+528100000001',
                password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'password', 10),
                role: user_entity_1.UserRole.RESIDENT,
                permissions: [],
                emailVerified: true,
                phoneVerified: true,
                status: 'active',
            }));
        }
        else if (resident.unitId !== unit.id || resident.organizationId !== organization.id) {
            resident.unitId = unit.id;
            resident.organizationId = organization.id;
            resident = await this.usersRepository.save(resident);
        }
        return {
            organization: {
                id: organization.id,
                name: organization.name,
            },
            property: {
                id: property.id,
                name: property.name,
            },
            unit: {
                id: unit.id,
                unitNumber: unit.unitNumber,
            },
            resident: {
                id: resident.id,
                name: `${resident.firstName} ${resident.lastName}`.trim(),
                email: resident.email,
            },
        };
    }
    async createInvitation(dto) {
        const provider = this.requireProvider(dto.accessControlProviderId);
        let pass;
        try {
            pass = await provider.createVisitorPass({
                visitorId: dto.visitorName.toLowerCase().replace(/\s+/g, '-'),
                visitorName: dto.visitorName,
                visitorPhone: dto.visitorPhone,
                visitorEmail: dto.visitorEmail,
                residentUnitId: dto.unitId,
                validFrom: new Date(dto.validFrom),
                validUntil: new Date(dto.validUntil),
                allowedDoors: dto.allowedDoors,
                maxEntries: dto.maxEntries,
                metadata: dto.metadata,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : typeof error === 'string'
                    ? error
                    : JSON.stringify(error);
            if (errorMessage.includes('access level ID (alIds)') ||
                errorMessage.includes('HIKVISION_DEFAULT_ACCESS_GROUP_ID') ||
                errorMessage.includes('metadata.accessLevelIds') ||
                errorMessage.includes('alIds')) {
                throw new common_1.BadRequestException('Hikvision aun no tiene una concesion de acceso asignada para este pase. ' +
                    'Configura HIKVISION_DEFAULT_ACCESS_GROUP_ID en el backend para que el pase pueda generarse.');
            }
            throw error;
        }
        const invitation = this.visitInvitationsRepository.create({
            propertyId: dto.propertyId,
            unitId: dto.unitId,
            visitorName: dto.visitorName,
            visitorPhone: dto.visitorPhone,
            visitorEmail: dto.visitorEmail,
            purpose: dto.purpose,
            validFrom: new Date(dto.validFrom),
            validUntil: new Date(dto.validUntil),
            status: 'pending',
            createdBy: dto.createdBy,
            accessControlPassId: pass.id,
            qrCode: pass.qrCode,
            metadata: {
                ...(dto.metadata ?? {}),
                allowedDoors: dto.allowedDoors ?? [],
                maxEntries: dto.maxEntries ?? null,
            },
        });
        const savedInvitation = await this.visitInvitationsRepository.save(invitation);
        return {
            invitation: savedInvitation,
            pass,
            share: this.buildSharePayload(savedInvitation),
        };
    }
    async findAllInvitations() {
        const invitations = await this.visitInvitationsRepository.find({
            order: { createdAt: 'DESC' },
        });
        return this.syncInvitationsWithHikvision(invitations);
    }
    async findInvitationById(id) {
        return this.visitInvitationsRepository.findOne({ where: { id } });
    }
    async sendInvitationEmail(id, dto) {
        const invitation = await this.findInvitationById(id);
        if (!invitation) {
            throw new common_1.NotFoundException(`Visit invitation ${id} not found`);
        }
        const targetEmail = (dto.email || invitation.visitorEmail || '').trim().toLowerCase();
        if (!targetEmail) {
            throw new common_1.BadRequestException('La invitacion no tiene correo del visitante. Captura un email antes de enviarla.');
        }
        const smtpHost = (process.env.SMTP_HOST || '').trim();
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        const smtpUser = (process.env.SMTP_USER || '').trim();
        const smtpPassword = process.env.SMTP_PASSWORD || '';
        const smtpConnectionTimeoutMs = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 12000);
        const smtpGreetingTimeoutMs = Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000);
        const smtpSocketTimeoutMs = Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000);
        const smtpDnsTimeoutMs = Number(process.env.SMTP_DNS_TIMEOUT_MS || 10000);
        const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPassword);
        const allowEtherealFallback = process.env.NODE_ENV !== 'production' &&
            String(process.env.SMTP_ALLOW_ETHEREAL_FALLBACK || '').toLowerCase() === 'true';
        if (!smtpConfigured && !allowEtherealFallback) {
            throw new common_1.BadRequestException('SMTP no esta configurado correctamente. Revisa SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD.');
        }
        const unit = await this.unitsRepository.findOne({ where: { id: invitation.unitId } });
        const resident = await this.usersRepository.findOne({ where: { id: invitation.createdBy } });
        const unitLabel = (typeof invitation.metadata?.unitLabel === 'string' && invitation.metadata.unitLabel.trim()) ||
            unit?.unitNumber ||
            invitation.unitId;
        const residentName = resident ? `${resident.firstName} ${resident.lastName}`.trim() : 'Residente ZIII Living';
        const shareUrl = `${this.resolveWebBaseUrl()}/access-control/share/${invitation.id}`;
        const logoPath = path.resolve(process.cwd(), 'apps/web/src/assets/ZIIILiving3.png');
        const logoCid = 'ziii-living-logo';
        const qrCid = 'ziii-visitor-qr';
        const attachments = [];
        if (fs.existsSync(logoPath)) {
            attachments.push({
                filename: 'ZIII-Living.png',
                path: logoPath,
                cid: logoCid,
            });
        }
        const qrInlineImage = await (0, visit_invitation_email_util_1.resolveQrInlineImage)(invitation.qrCode);
        if (qrInlineImage) {
            attachments.push({
                filename: `QR-${invitation.visitorName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || invitation.id}` +
                    `.${qrInlineImage.extension}`,
                content: qrInlineImage.buffer,
                contentType: qrInlineImage.contentType,
                cid: qrCid,
            });
        }
        const subject = dto.subject?.trim() || `ZIII Living | Pase de acceso para ${invitation.visitorName}`;
        const html = (0, visit_invitation_email_util_1.buildVisitInvitationEmailHtml)({
            invitation,
            shareUrl,
            logoCid: attachments.some((file) => file.cid === logoCid) ? logoCid : undefined,
            qrCid: attachments.some((file) => file.cid === qrCid) ? qrCid : undefined,
            unitLabel,
            residentName,
        });
        const text = (0, visit_invitation_email_util_1.buildVisitInvitationEmailText)(invitation, shareUrl, residentName);
        const createSmtpTransport = (port, secure) => nodemailer_1.default.createTransport({
            host: smtpHost,
            port,
            secure,
            requireTLS: !secure,
            auth: {
                user: smtpUser,
                pass: smtpPassword,
            },
            connectionTimeout: smtpConnectionTimeoutMs,
            greetingTimeout: smtpGreetingTimeoutMs,
            socketTimeout: smtpSocketTimeoutMs,
            dnsTimeout: smtpDnsTimeoutMs,
            tls: {
                minVersion: 'TLSv1.2',
            },
        });
        const createEtherealTransport = async () => {
            const testAccount = await nodemailer_1.default.createTestAccount();
            const transport = nodemailer_1.default.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            return {
                transport,
                fromAddress: testAccount.user,
            };
        };
        let transporter = null;
        let fromAddress = smtpUser;
        let fallbackTransport = false;
        let transport = 'smtp';
        let smtpPortUsed = smtpPort;
        const preferGmailSsl = this.shouldPreferGmailSsl(smtpHost, smtpPort);
        const initialSmtpPort = preferGmailSsl ? 465 : smtpPort;
        let info;
        const sendEmailWithTransport = async (activeTransport, from) => activeTransport.sendMail({
            from: `${process.env.SMTP_FROM_NAME || 'ZIII Living'} <${from || 'no-reply@ziii.com'}>`,
            to: targetEmail,
            subject,
            html,
            text,
            attachments,
        });
        try {
            if (smtpConfigured) {
                if (preferGmailSsl) {
                    this.logger.log('SMTP Gmail detectado con puerto 587: se utiliza 465/SSL para reducir latencia de envio.');
                }
                smtpPortUsed = initialSmtpPort;
                transporter = createSmtpTransport(initialSmtpPort, initialSmtpPort === 465);
                try {
                    info = await sendEmailWithTransport(transporter, fromAddress);
                }
                catch (smtpErr) {
                    if (this.shouldRetryGmailSsl(smtpHost, initialSmtpPort, smtpErr)) {
                        this.logger.warn(`SMTP Gmail en puerto ${initialSmtpPort} no respondio bien (code=${smtpErr?.code || 'n/a'}). Reintentando en 465/SSL.`);
                        smtpPortUsed = 465;
                        transporter = createSmtpTransport(465, true);
                        info = await sendEmailWithTransport(transporter, fromAddress);
                    }
                    else {
                        throw smtpErr;
                    }
                }
            }
            else {
                const ethereal = await createEtherealTransport();
                transporter = ethereal.transport;
                fromAddress = ethereal.fromAddress;
                fallbackTransport = true;
                transport = 'ethereal';
                smtpPortUsed = 465;
                info = await sendEmailWithTransport(transporter, fromAddress);
            }
        }
        catch (err) {
            if (smtpConfigured && allowEtherealFallback && err?.code === 'EAUTH') {
                const ethereal = await createEtherealTransport();
                transporter = ethereal.transport;
                fromAddress = ethereal.fromAddress;
                fallbackTransport = true;
                transport = 'ethereal';
                smtpPortUsed = 465;
                info = await sendEmailWithTransport(transporter, fromAddress);
            }
            else {
                this.logger.error(`Error enviando invitacion ${id} a ${targetEmail}: ${err?.message || err}`);
                throw new common_1.BadRequestException(this.resolveMailErrorMessage(err));
            }
        }
        const previewUrl = fallbackTransport ? nodemailer_1.default.getTestMessageUrl(info) : null;
        return {
            sent: true,
            invitationId: invitation.id,
            to: targetEmail,
            subject,
            messageId: info.messageId,
            shareUrl,
            previewUrl: previewUrl || undefined,
            transportFallback: fallbackTransport,
            transport,
            smtpPort: smtpPortUsed,
        };
    }
    async updateInvitation(id, dto) {
        const invitation = await this.findInvitationById(id);
        if (!invitation) {
            throw new common_1.NotFoundException(`Visit invitation ${id} not found`);
        }
        await this.visitInvitationsRepository.update(id, {
            ...dto,
            approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : invitation.approvedAt,
        });
        return this.findInvitationById(id);
    }
    async deleteInvitation(id) {
        const invitation = await this.findInvitationById(id);
        if (!invitation) {
            throw new common_1.NotFoundException(`Visit invitation ${id} not found`);
        }
        const passId = String(invitation.accessControlPassId || '').trim();
        let providerRevoked = false;
        if (passId) {
            try {
                await this.hikvisionProvider.revokePass(passId);
                providerRevoked = true;
            }
            catch (error) {
                this.logger.warn(`No se pudo revocar el pase ${passId} en Hikvision al eliminar invitacion ${id}: ${error?.message || error}`);
            }
        }
        await this.visitInvitationsRepository.delete(id);
        return {
            deleted: true,
            id,
            providerRevoked,
        };
    }
    async getEvents() {
        return this.accessEventsRepository.find({
            order: { timestamp: 'DESC' },
            take: 100,
        });
    }
    requireProvider(providerId) {
        const provider = this.providerFactory.get(providerId);
        if (!provider) {
            throw new common_1.NotFoundException(`Access control provider '${providerId}' is not registered`);
        }
        return provider;
    }
    buildSharePayload(invitation) {
        const shareUrl = `/access-control/share/${invitation.id}`;
        return {
            title: 'Visitor QR',
            shareUrl,
            qrCode: invitation.qrCode,
            message: `QR de visita para ${invitation.visitorName}`,
        };
    }
    resolveWebBaseUrl() {
        const configured = process.env.WEB_PUBLIC_BASE_URL ||
            process.env.FRONTEND_BASE_URL ||
            process.env.APP_WEB_URL ||
            '';
        if (configured.trim()) {
            return configured.replace(/\/$/, '');
        }
        const corsOrigin = process.env.CORS_ORIGIN || '';
        const firstCorsOrigin = corsOrigin
            .split(',')
            .map((value) => value.trim())
            .find(Boolean);
        if (firstCorsOrigin) {
            return firstCorsOrigin.replace(/\/$/, '');
        }
        return 'http://127.0.0.1:4174';
    }
    resolveMailErrorMessage(error) {
        const code = String(error?.code || '').toUpperCase();
        const responseCode = Number(error?.responseCode || 0);
        if (code === 'EAUTH' || responseCode === 535) {
            return 'No se pudo autenticar el correo SMTP. Revisa SMTP_USER y SMTP_PASSWORD.';
        }
        if (['ECONNECTION', 'ESOCKET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'].includes(code)) {
            return 'No se pudo conectar al servidor SMTP. Revisa SMTP_HOST, SMTP_PORT y conectividad.';
        }
        return error?.message
            ? `No fue posible enviar el correo: ${error.message}`
            : 'No fue posible enviar el correo con la configuracion SMTP actual.';
    }
    shouldRetryGmailSsl(smtpHost, smtpPort, error) {
        if (smtpPort !== 587) {
            return false;
        }
        if (!/gmail\.com$/i.test(smtpHost)) {
            return false;
        }
        const code = String(error?.code || '').toUpperCase();
        return ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EPIPE', 'ECONNRESET'].includes(code);
    }
    shouldPreferGmailSsl(smtpHost, smtpPort) {
        return smtpPort === 587 && /gmail\.com$/i.test(smtpHost);
    }
    async syncInvitationsWithHikvision(existingInvitations) {
        const integrationMode = String(process.env.HIKVISION_INTEGRATION_MODE || '').toLowerCase();
        if (integrationMode !== 'team') {
            return existingInvitations;
        }
        let snapshots = [];
        try {
            snapshots = await this.hikvisionProvider.listTemporaryPasses();
        }
        catch (error) {
            this.logger.warn(`No fue posible sincronizar pases desde Hikvision: ${error?.message || error}`);
            return existingInvitations;
        }
        if (!snapshots.length) {
            return existingInvitations;
        }
        const knownPassIds = new Set(existingInvitations
            .map((invitation) => String(invitation.accessControlPassId || '').trim())
            .filter(Boolean));
        const missingSnapshots = snapshots.filter((snapshot) => {
            const passId = String(snapshot.passId || '').trim();
            return Boolean(passId) && !knownPassIds.has(passId);
        });
        if (!missingSnapshots.length) {
            return existingInvitations;
        }
        const demoContext = await this.getOrCreateDemoContext();
        const now = new Date();
        const toImport = [];
        for (const snapshot of missingSnapshots) {
            const passId = String(snapshot.passId || '').trim();
            if (!passId || knownPassIds.has(passId)) {
                continue;
            }
            const validFrom = this.parseHikDate(snapshot.validFrom, new Date(now.getTime() - 60 * 60 * 1000));
            let validUntil = this.parseHikDate(snapshot.validUntil, new Date(now.getTime() + 8 * 60 * 60 * 1000));
            if (validUntil <= validFrom) {
                validUntil = new Date(validFrom.getTime() + 2 * 60 * 60 * 1000);
            }
            const invitation = this.visitInvitationsRepository.create({
                propertyId: demoContext.property.id,
                unitId: demoContext.unit.id,
                visitorName: snapshot.visitorName?.trim() || `Invitacion Hik ${passId}`,
                visitorEmail: snapshot.visitorEmail?.trim() || undefined,
                purpose: 'Importado automaticamente desde Hik-Connect Teams',
                validFrom,
                validUntil,
                status: this.mapHikPassStatus(snapshot.status, validUntil),
                createdBy: demoContext.resident.id,
                accessControlPassId: passId,
                qrCode: snapshot.qrCode || passId,
                metadata: {
                    source: 'hikvision-sync',
                    externalPassId: passId,
                    importedAt: new Date().toISOString(),
                    maxEntries: snapshot.maxEntries ?? null,
                },
            });
            toImport.push(invitation);
            knownPassIds.add(passId);
        }
        if (!toImport.length) {
            return existingInvitations;
        }
        const imported = await this.visitInvitationsRepository.save(toImport);
        this.logger.log(`Sincronizacion Hikvision: ${imported.length} pase(s) importados a ZIII.`);
        return [...imported, ...existingInvitations].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    parseHikDate(value, fallback) {
        if (!value) {
            return fallback;
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return fallback;
        }
        return parsed;
    }
    mapHikPassStatus(status, validUntil) {
        const normalized = String(status || '').toLowerCase();
        if (/(revok|cancel|delete|invalid|forbid)/.test(normalized)) {
            return 'revoked';
        }
        if (/(used|consum|passed|visitado)/.test(normalized)) {
            return 'used';
        }
        if (/(expire|caduc|outdated)/.test(normalized)) {
            return 'expired';
        }
        if (validUntil.getTime() < Date.now()) {
            return 'expired';
        }
        return 'approved';
    }
};
exports.AccessControlService = AccessControlService;
exports.AccessControlService = AccessControlService = AccessControlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(visit_invitation_entity_1.VisitInvitation)),
    __param(1, (0, typeorm_1.InjectRepository)(access_event_entity_1.AccessEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(3, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(4, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_control_provider_factory_1.AccessControlProviderFactoryService,
        hikvision_access_control_provider_1.HikvisionAccessControlProvider])
], AccessControlService);
//# sourceMappingURL=access-control.service.js.map