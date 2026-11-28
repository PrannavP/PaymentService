import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    InitiatePaymentPayload,
    InitiatePaymentResult,
    PaymentProvider,
    VerifyPaymentResult,
} from './interface/payment-provider.interface';
import { KhaltiProvider } from './providers/khalti.provider';

@Injectable()
export class PaymentService {
    // inject supported payment providers through NestJS DI
    constructor(private readonly khaltiProvider: KhaltiProvider) {}

    // initiate a payment using the requested payment method
    async initiatePayment(payload: InitiatePaymentPayload, paymentMethod: string): Promise<InitiatePaymentResult> {
        // make sure the payment method is valid before proceeding
        this.validatePaymentMethod(paymentMethod);

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

    // verify a payment using the requested payment method
    async verifyPayment(paymentId: string, paymentMethod: string): Promise<VerifyPaymentResult> {
        // make sure the payment method is valid before proceeding
        this.validatePaymentMethod(paymentMethod);

        // route the verification request to the matching payment provider
        switch (paymentMethod) {
            case PaymentProvider.KHALTI:
                // call Khalti provider lookup and return the normalized result
                return await this.khaltiProvider.verifyPayment(paymentId);

            default:
                // throw 400 if provider exists in enum but is not implemented yet
                throw new BadRequestException(`Unsupported payment method: ${paymentMethod}`);
        }
    }

    // check if the given payment method exists in our PaymentProvider enum
    private validatePaymentMethod(paymentMethod: string): void {
        const isValidMethod = Object.values(PaymentProvider).includes(
            paymentMethod as PaymentProvider,
        );
        if (!isValidMethod) {
            throw new BadRequestException(
                `Invalid payment method: ${paymentMethod}`,
            );
        }
    }
};