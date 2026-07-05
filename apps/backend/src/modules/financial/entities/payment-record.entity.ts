import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from '@/modules/units/entities/unit.entity';

export enum PaymentRecordStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50, default: 'MXN' })
  currency: string;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // 'card', 'bank_transfer', 'cash', 'check', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId: string; // Provider's transaction ID

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentProviderId: string; // 'mercado_pago', 'stripe', etc.

  @Column({ type: 'varchar', length: 50, default: PaymentRecordStatus.PENDING })
  status: PaymentRecordStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  appliedToQuotaIds: string[]; // Which quotas/charges this payment is applied to

  @Column({ type: 'simple-json', nullable: true })
  providerResponse: Record<string, any>; // Full response from payment provider

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
