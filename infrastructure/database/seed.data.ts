/**
 * DEVELOPMENT SEED DATA
 * 
 * Script para cargar datos de ejemplo en desarrollo
 * Ejecutar: npm run seed (después de implementar el script)
 */

export const seedData = {
  organizations: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Condominio Los Andes',
      description: 'Desarrollo habitacional en el sur de la ciudad',
      taxId: 'ORG001',
      phone: '+5255123456789',
      email: 'admin@losandes.mx',
      address: 'Avenida Principal 100',
      city: 'Mexico City',
      state: 'Mexico',
      country: 'MX',
      status: 'active',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Edificio Centro',
      description: 'Oficinas y departamentos en Centro',
      taxId: 'ORG002',
      phone: '+5255987654321',
      email: 'admin@edifcentro.mx',
      address: 'Paseo de la Reforma 505',
      city: 'Mexico City',
      state: 'Mexico',
      country: 'MX',
      status: 'active',
    },
  ],

  properties: [
    {
      id: '550e8400-e29b-41d4-a716-446655550001',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Torre A - Los Andes',
      propertyType: 'apartment_building',
      address: 'Avenida Principal 100, Torre A',
      city: 'Mexico City',
      state: 'Mexico',
      postalCode: '28002',
      totalUnits: 50,
      accessControlProviderId: 'hikvision',
      status: 'active',
    },
  ],

  units: [
    {
      id: '550e8400-e29b-41d4-a716-446655660001',
      propertyId: '550e8400-e29b-41d4-a716-446655550001',
      unitNumber: '101',
      bedroomCount: 2,
      area: 85.5,
      status: 'occupied',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655660002',
      propertyId: '550e8400-e29b-41d4-a716-446655550001',
      unitNumber: '102',
      bedroomCount: 3,
      area: 120.0,
      status: 'occupied',
    },
  ],

  users: [
    {
      id: '550e8400-e29b-41d4-a716-446655770001',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      unitId: null, // Admin sin unidad asignada
      firstName: 'Carlos',
      lastName: 'García',
      email: 'admin@losandes.mx',
      phone: '+5255123456789',
      role: 'admin',
      status: 'active',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655770002',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      unitId: '550e8400-e29b-41d4-a716-446655660001',
      firstName: 'Juan',
      lastName: 'Martínez',
      email: 'juan@example.mx',
      phone: '+5255987654321',
      role: 'resident',
      status: 'active',
    },
  ],

  quotas: [
    {
      id: '550e8400-e29b-41d4-a716-446655880001',
      unitId: '550e8400-e29b-41d4-a716-446655660001',
      propertyId: '550e8400-e29b-41d4-a716-446655550001',
      quotaNumber: 'Q-2024-01',
      type: 'ordinary',
      amount: 2500.0,
      dueDate: '2024-01-31',
      status: 'pending',
      description: 'Cuota ordinaria - Mantenimiento enero 2024',
    },
  ],
};
