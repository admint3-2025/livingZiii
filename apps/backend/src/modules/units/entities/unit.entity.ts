import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Property } from '@/modules/properties/entities/property.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'varchar', length: 50 })
  unitNumber: string; // e.g., "101", "A-05", "Casa 12"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'integer', nullable: true })
  bedroomCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number; // m²

  @Column({ type: 'varchar', length: 50, default: 'available' })
  status: 'available' | 'occupied' | 'rented' | 'maintenance';

  @OneToMany(() => User, (user) => user.unit)
  residents: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
