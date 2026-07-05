import { User } from '@/modules/users/entities/user.entity';
import { Organization } from '@/modules/organizations/entities/organization.entity';
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    VIEW = "VIEW",
    EXPORT = "EXPORT",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    PAYMENT = "PAYMENT",
    ACCESS = "ACCESS"
}
export declare class AuditLog {
    id: string;
    organizationId: string;
    organization: Organization;
    actorId: string;
    actor: User;
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    description: string;
    ipAddress: string;
    userAgent: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
//# sourceMappingURL=audit-log.entity.d.ts.map