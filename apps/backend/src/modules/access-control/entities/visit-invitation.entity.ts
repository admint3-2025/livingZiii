import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from '@/modules/units/entities/unit.entity';
import { Property } from '@/modules/properties/entities/property.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('visit_invitations')
export class VisitInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @Column({ type: 'varchar', length: 255 })
  visitorName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  visitorPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  visitorEmail: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  purpose: string;

  @Column({ type: 'datetime' })
  validFrom: Date;

  @Column({ type: 'datetime' })
  validUntil: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired' | 'revoked';

  @Column({ type: 'uuid' })
  createdBy: string; // Resident who invited

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  resident: User;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string; // Admin/guard who approved

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  // Access Control Integration
  @Column({ type: 'varchar', length: 255, nullable: true })
  accessControlPassId: string; // ID from provider (Hikvision, Dahua, etc.)

  @Column({ type: 'varchar', length: 500, nullable: true })
  qrCode: string; // QR string for display/print

  @Column({ type: 'varchar', length: 50, nullable: true })
  pinCode: string; // PIN fallback (if provider supports)

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
