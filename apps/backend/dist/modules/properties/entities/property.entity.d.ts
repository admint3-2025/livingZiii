import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
export declare class Property {
    id: string;
    organizationId: string;
    organization: Organization;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    propertyType?: string;
    totalUnits: number;
    accessControlProviderId?: string;
    accessControlConfig?: Record<string, any>;
    status: 'active' | 'inactive' | 'suspended';
    settings?: Record<string, any>;
    units: Unit[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=property.entity.d.ts.map