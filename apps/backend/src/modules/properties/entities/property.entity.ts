import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Unit } from '@/modules/units/entities/unit.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  propertyType?: string; // 'condominium', 'apartment_building', 'residential_development'

  @Column({ type: 'integer', default: 0 })
  totalUnits!: number;

  // Access Control Configuration
  @Column({ type: 'varchar', length: 255, nullable: true })
  accessControlProviderId?: string; // ID of the access control provider (e.g., 'hikvision', 'dahua')

  @Column({ type: 'simple-json', nullable: true })
  accessControlConfig?: Record<string, any>; // Provider-specific config (host, port, credentials, etc.)

  @Column({ type: 'varchar', length: 255, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'simple-json', nullable: true })
  settings?: Record<string, any>;

  @OneToMany(() => Unit, (unit) => unit.property)
  units!: Unit[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
