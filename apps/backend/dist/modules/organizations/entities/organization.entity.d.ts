export declare class Organization {
    id: string;
    name: string;
    description?: string;
    taxId?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    status: 'active' | 'inactive' | 'suspended';
    settings?: Record<string, any>;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=organization.entity.d.ts.map