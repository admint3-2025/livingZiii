import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';
import {
  AccessControlProviderFactoryService,
} from '@/providers/access-control-provider.factory';
import { AccessControlProviderConfig } from '@/providers/access-control.types';
import { HikvisionAccessControlProvider } from '@/providers/hikvision-access-control.provider';
import { AccessEvent } from './entities/access-event.entity';
import { VisitInvitation } from './entities/visit-invitation.entity';
import { CreateVisitInvitationDto } from './dtos/create-visit-invitation.dto';
import { SendVisitInvitationEmailDto } from './dtos/send-visit-invitation-email.dto';
import { UpdateVisitInvitationDto } from './dtos/update-visit-invitation.dto';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Property } from '@/modules/properties/entities/property.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
import { User, UserRole } from '@/modules/users/entities/user.entity';
import {
  buildVisitInvitationEmailHtml,
  buildVisitInvitationEmailText,
  resolveQrInlineImage,
} from './utils/visit-invitation-email.util';

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    @InjectRepository(VisitInvitation)
    private readonly visitInvitationsRepository: Repository<VisitInvitation>,
    @InjectRepository(AccessEvent)
    private readonly accessEventsRepository: Repository<AccessEvent>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(Unit)
    private readonly unitsRepository: Repository<Unit>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly providerFactory: AccessControlProviderFactoryService,
    private readonly hikvisionProvider: HikvisionAccessControlProvider,
  ) {}

  async listProviders() {
    return this.providerFactory.list().map((provider) => ({
      id: provider.id,
      name: provider.name,
    }));
  }

  async validateProvider(providerId: string, config: AccessControlProviderConfig) {
    const provider = this.requireProvider(providerId);
    return provider.validateCredentials(config);
  }

  async getProviderStatus(providerId: string) {
    const provider = this.requireProvider(providerId);
    return provider.getStatus();
  }

  async getOrCreateDemoContext() {
    let organization = await this.organizationsRepository.findOne({
      where: { name: 'ZIII Living Demo' },
    });

    if (!organization) {
      organization = await this.organizationsRepository.save(
        this.organizationsRepository.create({
          name: 'ZIII Living Demo',
          description: 'Organizacion local para pruebas rapidas de acceso temporal',
          email: 'demo@ziii.living',
          country: 'MX',
          status: 'active',
        }),
      );
    }

    let property = await this.propertiesRepository.findOne({
      where: {
        organizationId: organization.id,
        name: 'ZIII Torre Demo',
      },
    });

    if (!property) {
      property = await this.propertiesRepository.save(
        this.propertiesRepository.create({
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
        }),
      );
    }

    let unit = await this.unitsRepository.findOne({
      where: {
        propertyId: property.id,
        unitNumber: 'A-101',
      },
    });

    if (!unit) {
      unit = await this.unitsRepository.save(
        this.unitsRepository.create({
          propertyId: property.id,
          unitNumber: 'A-101',
          description: 'Unidad demo para pruebas de acceso',
          bedroomCount: 2,
          area: 85,
          status: 'occupied',
        }),
      );
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
      resident = await this.usersRepository.save(
        this.usersRepository.create({
          organizationId: organization.id,
          unitId: unit.id,
          firstName: 'Residente',
          lastName: 'Demo',
          email: residentEmail,
          phone: '+528100000001',
          password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'password', 10),
          role: UserRole.RESIDENT,
          permissions: [],
          emailVerified: true,
          phoneVerified: true,
          status: 'active',
        }),
      );
    } else if (resident.unitId !== unit.id || resident.organizationId !== organization.id) {
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

  async createInvitation(dto: CreateVisitInvitationDto) {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);

      if (
        errorMessage.includes('access level ID (alIds)') ||
        errorMessage.includes('HIKVISION_DEFAULT_ACCESS_GROUP_ID') ||
        errorMessage.includes('metadata.accessLevelIds') ||
        errorMessage.includes('alIds')
      ) {
        throw new BadRequestException(
          'Hikvision aun no tiene una concesion de acceso asignada para este pase. ' +
            'Configura HIKVISION_DEFAULT_ACCESS_GROUP_ID en el backend para que el pase pueda generarse.',
        );
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

  async findInvitationById(id: string) {
    return this.visitInvitationsRepository.findOne({ where: { id } });
  }

  async sendInvitationEmail(id: string, dto: SendVisitInvitationEmailDto) {
    const invitation = await this.findInvitationById(id);
    if (!invitation) {
      throw new NotFoundException(`Visit invitation ${id} not found`);
    }

    const targetEmail = (dto.email || invitation.visitorEmail || '').trim().toLowerCase();
    if (!targetEmail) {
      throw new BadRequestException('La invitacion no tiene correo del visitante. Captura un email antes de enviarla.');
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
    const allowEtherealFallback =
      process.env.NODE_ENV !== 'production' &&
      String(process.env.SMTP_ALLOW_ETHEREAL_FALLBACK || '').toLowerCase() === 'true';

    if (!smtpConfigured && !allowEtherealFallback) {
      throw new BadRequestException(
        'SMTP no esta configurado correctamente. Revisa SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD.',
      );
    }

    const unit = await this.unitsRepository.findOne({ where: { id: invitation.unitId } });
    const resident = await this.usersRepository.findOne({ where: { id: invitation.createdBy } });
    const unitLabel =
      (typeof invitation.metadata?.unitLabel === 'string' && invitation.metadata.unitLabel.trim()) ||
      unit?.unitNumber ||
      invitation.unitId;
    const residentName = resident ? `${resident.firstName} ${resident.lastName}`.trim() : 'Residente ZIII Living';

    const shareUrl = `${this.resolveWebBaseUrl()}/access-control/share/${invitation.id}`;
    const logoPath = path.resolve(process.cwd(), 'apps/web/src/assets/ZIIILiving3.png');
    const logoCid = 'ziii-living-logo';
    const qrCid = 'ziii-visitor-qr';
    const attachments: Array<Record<string, any>> = [];

    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'ZIII-Living.png',
        path: logoPath,
        cid: logoCid,
      });
    }

    const qrInlineImage = await resolveQrInlineImage(invitation.qrCode);
    if (qrInlineImage) {
      attachments.push({
        filename:
          `QR-${invitation.visitorName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || invitation.id}` +
          `.${qrInlineImage.extension}`,
        content: qrInlineImage.buffer,
        contentType: qrInlineImage.contentType,
        cid: qrCid,
      });
    }

    const subject = dto.subject?.trim() || `ZIII Living | Pase de acceso para ${invitation.visitorName}`;
    const html = buildVisitInvitationEmailHtml({
      invitation,
      shareUrl,
      logoCid: attachments.some((file) => file.cid === logoCid) ? logoCid : undefined,
      qrCid: attachments.some((file) => file.cid === qrCid) ? qrCid : undefined,
      unitLabel,
      residentName,
    });
    const text = buildVisitInvitationEmailText(invitation, shareUrl, residentName);

    const createSmtpTransport = (port: number, secure: boolean) =>
      nodemailer.createTransport({
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
      const testAccount = await nodemailer.createTestAccount();
      const transport = nodemailer.createTransport({
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

    let transporter: nodemailer.Transporter | null = null;
    let fromAddress = smtpUser;
    let fallbackTransport = false;
    let transport: 'smtp' | 'ethereal' = 'smtp';
    let smtpPortUsed = smtpPort;
    const preferGmailSsl = this.shouldPreferGmailSsl(smtpHost, smtpPort);
    const initialSmtpPort = preferGmailSsl ? 465 : smtpPort;
    let info: any;

    const sendEmailWithTransport = async (activeTransport: nodemailer.Transporter, from: string) =>
      activeTransport.sendMail({
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
        } catch (smtpErr: any) {
          if (this.shouldRetryGmailSsl(smtpHost, initialSmtpPort, smtpErr)) {
            this.logger.warn(
              `SMTP Gmail en puerto ${initialSmtpPort} no respondio bien (code=${smtpErr?.code || 'n/a'}). Reintentando en 465/SSL.`,
            );
            smtpPortUsed = 465;
            transporter = createSmtpTransport(465, true);
            info = await sendEmailWithTransport(transporter, fromAddress);
          } else {
            throw smtpErr;
          }
        }
      } else {
        const ethereal = await createEtherealTransport();
        transporter = ethereal.transport;
        fromAddress = ethereal.fromAddress;
        fallbackTransport = true;
        transport = 'ethereal';
        smtpPortUsed = 465;
        info = await sendEmailWithTransport(transporter, fromAddress);
      }
    } catch (err: any) {
      if (smtpConfigured && allowEtherealFallback && err?.code === 'EAUTH') {
        const ethereal = await createEtherealTransport();
        transporter = ethereal.transport;
        fromAddress = ethereal.fromAddress;
        fallbackTransport = true;
        transport = 'ethereal';
        smtpPortUsed = 465;
        info = await sendEmailWithTransport(transporter, fromAddress);
      } else {
        this.logger.error(`Error enviando invitacion ${id} a ${targetEmail}: ${err?.message || err}`);
        throw new BadRequestException(this.resolveMailErrorMessage(err));
      }
    }

    const previewUrl = fallbackTransport ? nodemailer.getTestMessageUrl(info) : null;

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

  async updateInvitation(id: string, dto: UpdateVisitInvitationDto) {
    const invitation = await this.findInvitationById(id);
    if (!invitation) {
      throw new NotFoundException(`Visit invitation ${id} not found`);
    }

    await this.visitInvitationsRepository.update(id, {
      ...dto,
      approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : invitation.approvedAt,
    });

    return this.findInvitationById(id);
  }

  async deleteInvitation(id: string) {
    const invitation = await this.findInvitationById(id);
    if (!invitation) {
      throw new NotFoundException(`Visit invitation ${id} not found`);
    }

    const passId = String(invitation.accessControlPassId || '').trim();
    let providerRevoked = false;

    if (passId) {
      try {
        await this.hikvisionProvider.revokePass(passId);
        providerRevoked = true;
      } catch (error: any) {
        this.logger.warn(
          `No se pudo revocar el pase ${passId} en Hikvision al eliminar invitacion ${id}: ${error?.message || error}`,
        );
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

  private requireProvider(providerId: string) {
    const provider = this.providerFactory.get(providerId);
    if (!provider) {
      throw new NotFoundException(`Access control provider '${providerId}' is not registered`);
    }

    return provider;
  }

  private buildSharePayload(invitation: VisitInvitation) {
    const shareUrl = `/access-control/share/${invitation.id}`;

    return {
      title: 'Visitor QR',
      shareUrl,
      qrCode: invitation.qrCode,
      message: `QR de visita para ${invitation.visitorName}`,
    };
  }

  private resolveWebBaseUrl(): string {
    const configured =
      process.env.WEB_PUBLIC_BASE_URL ||
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

  private resolveMailErrorMessage(error: any): string {
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

  private shouldRetryGmailSsl(smtpHost: string, smtpPort: number, error: any): boolean {
    if (smtpPort !== 587) {
      return false;
    }

    if (!/gmail\.com$/i.test(smtpHost)) {
      return false;
    }

    const code = String(error?.code || '').toUpperCase();
    return ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EPIPE', 'ECONNRESET'].includes(code);
  }

  private shouldPreferGmailSsl(smtpHost: string, smtpPort: number): boolean {
    return smtpPort === 587 && /gmail\.com$/i.test(smtpHost);
  }

  private async syncInvitationsWithHikvision(existingInvitations: VisitInvitation[]): Promise<VisitInvitation[]> {
    const integrationMode = String(process.env.HIKVISION_INTEGRATION_MODE || '').toLowerCase();
    if (integrationMode !== 'team') {
      return existingInvitations;
    }

    let snapshots: Array<{
      passId: string;
      visitorName?: string;
      visitorEmail?: string;
      validFrom?: string;
      validUntil?: string;
      status?: string;
      qrCode?: string;
      maxEntries?: number;
    }> = [];

    try {
      snapshots = await this.hikvisionProvider.listTemporaryPasses();
    } catch (error: any) {
      this.logger.warn(`No fue posible sincronizar pases desde Hikvision: ${error?.message || error}`);
      return existingInvitations;
    }

    if (!snapshots.length) {
      return existingInvitations;
    }

    const knownPassIds = new Set(
      existingInvitations
        .map((invitation) => String(invitation.accessControlPassId || '').trim())
        .filter(Boolean),
    );
    const missingSnapshots = snapshots.filter((snapshot) => {
      const passId = String(snapshot.passId || '').trim();
      return Boolean(passId) && !knownPassIds.has(passId);
    });

    if (!missingSnapshots.length) {
      return existingInvitations;
    }

    const demoContext = await this.getOrCreateDemoContext();
    const now = new Date();
    const toImport: VisitInvitation[] = [];

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

  private parseHikDate(value: string | undefined, fallback: Date): Date {
    if (!value) {
      return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }

    return parsed;
  }

  private mapHikPassStatus(status: string | undefined, validUntil: Date): VisitInvitation['status'] {
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
}
