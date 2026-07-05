import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from '@/modules/units/entities/unit.entity';
import { Property } from '@/modules/properties/entities/property.entity';

export enum QuotaType {
  ORDINARY = 'ordinary', // Mantenimiento
  EXTRAORDINARY = 'extraordinary', // Reparaciones extraordinarias
}

export enum QuotaStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('quotas')
export class Quota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'varchar', length: 50 })
  quotaNumber: string; // e.g., "Q-2024-01", sequential

  @Column({ type: 'varchar', length: 50, default: QuotaType.ORDINARY })
  type: QuotaType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paymentDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'varchar', length: 50, default: QuotaStatus.PENDING })
  status: QuotaStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
