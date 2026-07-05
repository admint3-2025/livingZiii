import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { CreateAccessControlProviderDto } from './dtos/create-access-control-provider.dto';
import { CreateVisitInvitationDto } from './dtos/create-visit-invitation.dto';
import { SendVisitInvitationEmailDto } from './dtos/send-visit-invitation-email.dto';
import { UpdateVisitInvitationDto } from './dtos/update-visit-invitation.dto';

@ApiTags('Access Control')
@Controller('access-control')
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List registered access control providers' })
  async listProviders() {
    return this.accessControlService.listProviders();
  }

  @Post('providers/:providerId/validate')
  @ApiOperation({ summary: 'Validate access control provider credentials' })
  async validateProvider(@Param('providerId') providerId: string, @Body() dto: CreateAccessControlProviderDto) {
    return this.accessControlService.validateProvider(providerId, dto);
  }

  @Get('providers/:providerId/status')
  @ApiOperation({ summary: 'Get provider status' })
  async providerStatus(@Param('providerId') providerId: string) {
    return this.accessControlService.getProviderStatus(providerId);
  }

  @Get('demo-context')
  @ApiOperation({ summary: 'Get or create demo organization/property/unit/resident for quick temporary visits' })
  async getDemoContext() {
    return this.accessControlService.getOrCreateDemoContext();
  }

  @Post('visit-invitations')
  @ApiOperation({ summary: 'Create visitor invitation and access pass' })
  async createInvitation(@Body() dto: CreateVisitInvitationDto) {
    return this.accessControlService.createInvitation(dto);
  }

  @Get('visit-invitations')
  @ApiOperation({ summary: 'List visitor invitations' })
  async findAllInvitations() {
    return this.accessControlService.findAllInvitations();
  }

  @Get('visit-invitations/:id')
  @ApiOperation({ summary: 'Get a visitor invitation' })
  async findInvitationById(@Param('id') id: string) {
    return this.accessControlService.findInvitationById(id);
  }

  @Put('visit-invitations/:id')
  @ApiOperation({ summary: 'Update a visitor invitation' })
  async updateInvitation(@Param('id') id: string, @Body() dto: UpdateVisitInvitationDto) {
    return this.accessControlService.updateInvitation(id, dto);
  }

  @Delete('visit-invitations/:id')
  @ApiOperation({ summary: 'Delete visitor invitation and revoke provider pass' })
  async deleteInvitation(@Param('id') id: string) {
    return this.accessControlService.deleteInvitation(id);
  }

  @Get('visit-invitations/:id/share')
  @ApiOperation({ summary: 'Get share payload for visitor QR' })
  async shareInvitation(@Param('id') id: string) {
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

  @Post('visit-invitations/:id/send-email')
  @ApiOperation({ summary: 'Send a visitor invitation by email' })
  async sendInvitationEmail(@Param('id') id: string, @Body() dto: SendVisitInvitationEmailDto) {
    return this.accessControlService.sendInvitationEmail(id, dto);
  }
}
