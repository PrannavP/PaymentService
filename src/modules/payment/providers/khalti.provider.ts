import { Injectable } from "@nestjs/common";
import { InitiatePaymentPayload, PaymentProvider, PaymentProviderInterface } from "../interface/payment-provider.interface";

// making the class injectable so that it can be injected into other classes
@Injectable()
export class KhaltiProvider implements PaymentProviderInterface {
    readonly method = PaymentProvider.KHALTI;

    async initiatePayment(payload: InitiatePaymentPayload): Promise<any> {
        // Implement the logic to initiate a payment with Khalti
        // You can use Khalti's API to create a payment request
        // Return the response from Khalti's API

        // call the khalti api to initiate the payment and return the response
        
    };

    async verifyPayment(paymentId: string): Promise<any> {
        // Implement the logic to verify a payment with Khalti
        // You can use Khalti's API to verify the payment status
        // Return the response from Khalti's API

    };

    async refundPayment(paymentId: string, amount: number): Promise<any> {
        // Implement the logic to refund a payment with Khalti
        // You can use Khalti's API to initiate a refund request
        // Return the response from Khalti's API
    };
};