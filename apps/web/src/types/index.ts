/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Auth types
 */
export interface User {
  id: string;
  organizationId: string;
  unitId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'resident' | 'visitor' | 'guard' | 'staff';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

/**
 * Organization types
 */
export interface Organization {
  id: string;
  name: string;
  description?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Property types
 */
export interface Property {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  propertyType?: string;
  totalUnits: number;
  accessControlProviderId?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Unit types
 */
export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  description?: string;
  bedroomCount?: number;
  area?: number;
  status: 'available' | 'occupied' | 'rented' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Financial types
 */
export interface Quota {
  id: string;
  unitId: string;
  propertyId: string;
  quotaNumber: string;
  type: 'ordinary' | 'extraordinary';
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  paidAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  createdAt: Date;
}

export interface Charge {
  id: string;
  unitId: string;
  type: 'fine' | 'interest' | 'service' | 'other';
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'cancelled' | 'waived';
  description?: string;
  createdAt: Date;
}

export interface StateOfAccount {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  quotas: Quota[];
}

/**
 * Payment types
 */
export interface PaymentRecord {
  id: string;
  unitId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  paymentProviderId?: string;
  status: 'pending' | 'processing' | 'approved' | 'failed' | 'refunded';
  description?: string;
  receiptUrl?: string;
  createdAt: Date;
}

/**
 * Access control types
 */
export interface AccessControlProviderSummary {
  id: string;
  name: string;
}

export interface AccessControlProviderConfig {
  providerId: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol?: 'http' | 'https';
  integrationMode?: 'device' | 'team';
}

export interface VisitInvitation {
  id: string;
  propertyId: string;
  unitId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  purpose?: string;
  validFrom: string;
  validUntil: string;
  status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired' | 'revoked';
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  accessControlPassId?: string;
  qrCode?: string;
  pinCode?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AccessControlPass {
  id: string;
  qrCode?: string;
  nfcToken?: string;
  pin?: string;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'expired' | 'revoked' | 'used';
  createdAt: string;
}

export interface AccessControlDemoContext {
  organization: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  };
  unit: {
    id: string;
    unitNumber: string;
  };
  resident: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateVisitInvitationRequest {
  propertyId: string;
  unitId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  purpose?: string;
  createdBy: string;
  accessControlProviderId: string;
  validFrom: string;
  validUntil: string;
  allowedDoors?: string[];
  maxEntries?: number;
  metadata?: Record<string, any>;
}

export interface CreateVisitInvitationResponse {
  invitation: VisitInvitation;
  pass: AccessControlPass;
  share: {
    title: string;
    shareUrl: string;
    qrCode?: string;
    message: string;
  };
}

export interface SendVisitInvitationEmailResponse {
  sent: boolean;
  invitationId: string;
  to: string;
  subject: string;
  messageId: string;
  shareUrl: string;
  previewUrl?: string;
  transportFallback?: boolean;
  transport?: 'smtp' | 'ethereal';
  smtpPort?: number;
}
