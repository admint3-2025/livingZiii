import { Property } from '@/modules/properties/entities/property.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare class Unit {
    id: string;
    propertyId: string;
    property: Property;
    unitNumber: string;
    description: string;
    bedroomCount: number;
    area: number;
    status: 'available' | 'occupied' | 'rented' | 'maintenance';
    residents: User[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=unit.entity.d.ts.map