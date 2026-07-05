import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from '@/modules/properties/entities/property.entity';

@Entity('access_events')
export class AccessEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 50 })
  eventType: string; // 'entry', 'exit', 'entry_denied', 'alarm', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  personId: string; // Resident, visitor, staff ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  visitPassId: string; // Linked to visit invitation if applicable

  @Column({ type: 'varchar', length: 255 })
  deviceId: string; // Physical reader/device ID

  @Column({ type: 'varchar', length: 255 })
  doorId: string; // Door/gate/access point

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string; // Friendly name

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo: string; // Base64 or URL (optional)

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any>; // Provider-specific details

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
