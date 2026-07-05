import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from '@/modules/units/entities/unit.entity';

export enum ChargeType {
  FINE = 'fine', // Multa
  INTEREST = 'interest', // Intereses
  SERVICE = 'service', // Servicio específico
  OTHER = 'other',
}

export enum ChargeStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  WAIVED = 'waived',
}

@Entity('charges')
export class Charge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @Column({ type: 'varchar', length: 50, default: ChargeType.OTHER })
  type: ChargeType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 50, default: ChargeStatus.PENDING })
  status: ChargeStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  relatedQuotaId: string; // Link to quota if applicable (e.g., interest on overdue quota)

  @Column({ type: 'uuid', nullable: true })
  createdBy: string; // User ID

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
