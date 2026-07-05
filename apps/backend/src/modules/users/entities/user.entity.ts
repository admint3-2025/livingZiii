import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Unit } from '@/modules/units/entities/unit.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  RESIDENT = 'resident',
  VISITOR = 'visitor',
  GUARD = 'guard',
  STAFF = 'staff',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'uuid', nullable: true })
  unitId?: string;

  @ManyToOne(() => Unit, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'unitId' })
  unit?: Unit;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string; // bcrypt hashed

  @Column({ type: 'varchar', length: 50, default: UserRole.RESIDENT })
  role!: UserRole;

  @Column({ type: 'simple-array', default: '[]' })
  permissions!: string[]; // Fine-grained permissions

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Column({ type: 'varchar', length: 255, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
