import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentProvider, InitiatePaymentPayload } from '../payment/interface/payment-provider.interface';
import { KhaltiProvider } from './providers/khalti.provider';

@Injectable()
export class PaymentService {
    // payment method intiate method
    // todo: for now promise returns any, later we will define a proper interface for the response of the payment provider.
    async initiatePayment(payload: InitiatePaymentPayload, paymentMethod: string): Promise<any> {
        // validate the payment method
        if (!Object.values(PaymentProvider).includes(paymentMethod as PaymentProvider)) {
            throw new Error(`Invalid payment method: ${paymentMethod}`);
        };

        // generate a unique transaction id for the payment
        const transactionId = uuidv4();

        // call the respective payment provider according to payment method.
        switch (paymentMethod) {
            case PaymentProvider.KHALTI:
                // call Khalti provider from providers
                const khaltiProvider = new KhaltiProvider();

                // initiate the payment with the khalti provider and return the response
                return await khaltiProvider.initiatePayment(payload);

                break;
            default:
                throw new Error(`Unsupported payment method: ${paymentMethod}`);
        };
    };
};