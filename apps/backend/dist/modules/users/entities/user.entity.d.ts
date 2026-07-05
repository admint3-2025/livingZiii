import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Unit } from '@/modules/units/entities/unit.entity';
export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    RESIDENT = "resident",
    VISITOR = "visitor",
    GUARD = "guard",
    STAFF = "staff"
}
export declare class User {
    id: string;
    organizationId: string;
    organization: Organization;
    unitId?: string;
    unit?: Unit;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    permissions: string[];
    emailVerified: boolean;
    phoneVerified: boolean;
    status: 'active' | 'inactive' | 'suspended';
    metadata?: Record<string, any>;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.entity.d.ts.map