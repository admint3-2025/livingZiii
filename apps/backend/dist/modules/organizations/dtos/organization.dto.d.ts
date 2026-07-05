export declare class CreateOrganizationDto {
    name: string;
    description?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}
export declare class UpdateOrganizationDto {
    name?: string;
    description?: string;
    email?: string;
    status?: 'active' | 'inactive' | 'suspended';
}
//# sourceMappingURL=organization.dto.d.ts.map