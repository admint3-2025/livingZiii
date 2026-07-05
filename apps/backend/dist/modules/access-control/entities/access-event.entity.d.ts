import { Property } from '@/modules/properties/entities/property.entity';
export declare class AccessEvent {
    id: string;
    propertyId: string;
    property: Property;
    timestamp: Date;
    eventType: string;
    personId: string;
    visitPassId: string;
    deviceId: string;
    doorId: string;
    location: string;
    success: boolean;
    photo: string;
    details: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
}
//# sourceMappingURL=access-event.entity.d.ts.map