import { OrganizationsService } from '../services/organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../dtos/organization.dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(dto: CreateOrganizationDto): Promise<import("../entities/organization.entity").Organization>;
    findAll(): Promise<import("../entities/organization.entity").Organization[]>;
    findById(id: string): Promise<import("../entities/organization.entity").Organization | null>;
    update(id: string, dto: UpdateOrganizationDto): Promise<import("../entities/organization.entity").Organization | null>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=organizations.controller.d.ts.map