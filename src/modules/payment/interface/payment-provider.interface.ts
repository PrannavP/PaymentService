// Enum for payment providers
export enum PaymentProvider {
    KHALTI = 'khalti',
    ESEWA = 'esewa',
    PAYPAL = 'paypal',
    STRIPE = 'stripe',
}

// type for initate payment payload
export interface InitiatePaymentPayload {
    amount: number;
    success_url?: string;
    failure_url?: string;
    return_url?: string;
    website_url?: string;
    purchase_order_id?: string;
    purchase_order_name?: string;
}

// create an interface for payment providers so all payment providers can implement this interface and provide their own implementation for the methods defined in the interface
export interface PaymentProviderInterface {
    // Method to initiate a payment
    initiatePayment(payload: InitiatePaymentPayload): Promise<any>;

    // Method to verify a payment
    verifyPayment(paymentId: string): Promise<any>;

    // refund if the payment method supports refund
    // use "?" to make this method optional, as not all payment providers support refund
    refundPayment?(paymentId: string, amount: number): Promise<any>;
}
