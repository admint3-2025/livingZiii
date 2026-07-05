import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare class SeedService implements OnModuleInit {
    private readonly organizationsRepository;
    private readonly usersRepository;
    private readonly logger;
    constructor(organizationsRepository: Repository<Organization>, usersRepository: Repository<User>);
    onModuleInit(): Promise<void>;
    private seedDemoData;
}
//# sourceMappingURL=seed.service.d.ts.map