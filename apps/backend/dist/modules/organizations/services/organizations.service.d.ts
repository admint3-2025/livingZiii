import { Repository } from 'typeorm';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@/modules/organizations/dtos/organization.dto';
export declare class OrganizationsService {
    private organizationsRepository;
    private readonly logger;
    constructor(organizationsRepository: Repository<Organization>);
    create(dto: CreateOrganizationDto): Promise<Organization>;
    findAll(): Promise<Organization[]>;
    findById(id: string): Promise<Organization | null>;
    update(id: string, dto: UpdateOrganizationDto): Promise<Organization | null>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=organizations.service.d.ts.map