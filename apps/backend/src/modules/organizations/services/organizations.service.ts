import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@/modules/organizations/dtos/organization.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    this.logger.log(`Creating organization: ${dto.name}`);

    const organization = this.organizationsRepository.create(dto);
    return this.organizationsRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationsRepository.find();
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationsRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization | null> {
    this.logger.log(`Updating organization: ${id}`);

    await this.organizationsRepository.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing organization: ${id}`);
    await this.organizationsRepository.delete(id);
  }
}
