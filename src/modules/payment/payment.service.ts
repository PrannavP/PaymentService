import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    InitiatePaymentPayload,
    InitiatePaymentResult,
    PaymentProvider,
} from './interface/payment-provider.interface';
import { KhaltiProvider } from './providers/khalti.provider';

@Injectable()
export class PaymentService {
    // inject supported payment providers through NestJS DI
    constructor(private readonly khaltiProvider: KhaltiProvider) {}

    // initiate a payment using the requested payment method
    async initiatePayment(
        payload: InitiatePaymentPayload,
        paymentMethod: string,
    ): Promise<InitiatePaymentResult> {
        // check if the given payment method is in our supported enum
        const isValidMethod = Object.values(PaymentProvider).includes(
            paymentMethod as PaymentProvider,
        );
        if (!isValidMethod) {
            throw new BadRequestException(
                `Invalid payment method: ${paymentMethod}`,
            );
        }

        // generate a unique internal transaction id for tracking
        const transactionId = uuidv4();

        // route the request to the matching payment provider
        switch (paymentMethod) {
            case PaymentProvider.KHALTI:
                // call Khalti provider and return the normalized result
                return await this.khaltiProvider.initiatePayment(
                    payload,
                    transactionId,
                );

            default:
                // throw 400 if provider exists in enum but is not implemented yet
                throw new BadRequestException(
                    `Unsupported payment method: ${paymentMethod}`,
                );
        }
    }
}
