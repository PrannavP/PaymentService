// supported payment providers in this service
export enum PaymentProvider {
    KHALTI = 'khalti',
    ESEWA = 'esewa',
    PAYPAL = 'paypal',
    STRIPE = 'stripe',
};

// possible states of a payment transaction
export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
    REFUNDED = 'REFUNDED',
};

// input data needed to initiate a payment
export interface InitiatePaymentPayload {
    amount: number;
    success_url?: string;
    failure_url?: string;
    return_url?: string;
    website_url?: string;
    purchase_order_id?: string;
    purchase_order_name?: string;
    customer_name?: string;
    customer_email?: string;
};

// standard response returned by any payment provider after initiating payment
export interface InitiatePaymentResult {
    transactionId: string;
    provider: PaymentProvider;
    providerRef: string;
    paymentUrl: string;
    expiresAt?: string;
    rawResponse?: unknown;
};

// standard response returned by any payment provider after verifying payment
export interface VerifyPaymentResult {
    provider: PaymentProvider;
    providerRef: string;
    status: PaymentStatus;
    amount: number;
    rawResponse?: unknown;
};

// common contract that every payment provider (Khalti, eSewa, Stripe, etc.) must implement
export interface PaymentProviderInterface {
    // identifies which provider this class handles
    readonly method: PaymentProvider;

    // start a payment and return a redirect payment URL
    initiatePayment(payload: InitiatePaymentPayload, transactionId: string): Promise<InitiatePaymentResult>;

    // verify payment status directly with the provider
    verifyPayment(paymentId: string): Promise<VerifyPaymentResult>;

    // optional refund method for providers that support refunds
    refundPayment?(paymentId: string, amount: number): Promise<unknown>;
};