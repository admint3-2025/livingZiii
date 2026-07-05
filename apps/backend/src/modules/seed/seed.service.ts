import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { User, UserRole } from '@/modules/users/entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    await this.seedDemoData();
  }

  private async seedDemoData(): Promise<void> {
    let organization = await this.organizationsRepository.findOne({
      where: { name: 'ZIII Living Demo' },
    });

    if (!organization) {
      organization = await this.organizationsRepository.save(
        this.organizationsRepository.create({
          name: 'ZIII Living Demo',
          description: 'Organización de demostración para desarrollo local',
          email: 'demo@ziii.living',
          country: 'MX',
          status: 'active',
        }),
      );
      this.logger.log(`Organización demo creada: ${organization.id}`);
    }

    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const existingAdmin = await this.usersRepository.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const password = process.env.SEED_ADMIN_PASSWORD || 'password';
      const hashedPassword = await bcrypt.hash(password, 10);

      await this.usersRepository.save(
        this.usersRepository.create({
          organizationId: organization.id,
          firstName: 'Admin',
          lastName: 'ZIII',
          email: adminEmail,
          phone: '+520000000000',
          password: hashedPassword,
          role: UserRole.ADMIN,
          permissions: [],
          emailVerified: true,
          status: 'active',
        }),
      );

      this.logger.log(`Usuario admin demo creado: ${adminEmail}`);
    }
  }
}
