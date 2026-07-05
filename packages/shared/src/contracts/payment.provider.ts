/**
 * PAYMENT PROVIDER CONTRACTS
 * 
 * Define a pluggable payment provider system that allows integration
 * with multiple payment processors (Mercado Pago, Stripe, Conekta, SPEI, etc.)
 */

export interface PaymentProviderConfig {
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  webhookSecret?: string;
  [key: string]: any;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank_transfer' | 'cash' | 'other';
  lastDigits?: string;
}

export interface PaymentRequest {
  externalId: string; // Unique ID from ZIII (e.g., cuota_123)
  amount: number; // In cents (100 = $1.00)
  currency: string; // MXN, USD
  description: string;
  payerEmail: string;
  payerName: string;
  payerPhone?: string;
  // Metadata for reconciliation
  unitId: string;
  propertyId: string;
  organizationId: string;
  type: 'quota' | 'charge' | 'fine';
  dueDate?: Date;
  // Return URL after payment (success/failure)
  successUrl?: string;
  failureUrl?: string;
}

export interface PaymentResponse {
  transactionId: string; // Provider's transaction ID
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: Date;
  paymentUrl?: string; // URL to redirect user to payment page
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface WebhookPayload {
  transactionId: string;
  externalId: string;
  status: PaymentStatus;
  amount: number;
  timestamp: Date;
  [key: string]: any;
}

/**
 * Main PaymentProvider interface
 */
export interface PaymentProvider {
  /**
   * Unique identifier for the provider
   * e.g., 'mercado_pago', 'stripe', 'conekta'
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Initialize and validate credentials with the payment processor
   */
  validateCredentials(config: PaymentProviderConfig): Promise<boolean>;

  /**
   * Create a payment request and return payment link/URL
   */
  createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Get payment status
   */
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;

  /**
   * Refund a payment
   */
  refundPayment(transactionId: string, amount?: number): Promise<boolean>;

  /**
   * Handle incoming webhook from payment processor
   */
  handleWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * Register webhook URL with the payment processor (optional)
   */
  registerWebhook?(webhookUrl: string): Promise<void>;

  /**
   * Get provider fees/commissions info
   */
  getCommissionInfo(amount: number): Promise<{ commission: number; net: number }>;
}

/**
 * Factory to register and manage multiple payment providers
 */
export interface PaymentProviderFactory {
  register(provider: PaymentProvider): void;
  unregister(providerId: string): void;
  get(providerId: string): PaymentProvider | null;
  list(): PaymentProvider[];
}
