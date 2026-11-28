import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    InitiatePaymentPayload,
    InitiatePaymentResult,
    PaymentProvider,
    PaymentProviderInterface,
    VerifyPaymentResult,
} from '../interface/payment-provider.interface';

// shape of the success response returned by Khalti epayment initiate API
interface KhaltiInitiateResponse {
    pidx: string;
    payment_url: string;
    expires_at?: string;
    expires_in?: number;
};

@Injectable()
export class KhaltiProvider implements PaymentProviderInterface {
    // mark this provider as Khalti
    readonly method = PaymentProvider.KHALTI;

    // logger for Khalti API calls and errors
    private readonly logger = new Logger(KhaltiProvider.name);

    // inject ConfigService so we can safely read env variables
    constructor(private readonly configService: ConfigService) {}


    async initiatePayment(payload: InitiatePaymentPayload, transactionId: string): Promise<InitiatePaymentResult> {
        // check if the app is running in production mode
        const isProduction = this.configService.get<string>('IS_PRODUCTION') === 'true';

        // pick the right Khalti base URL based on environment
        const baseUrl = this.configService.getOrThrow<string>(
            isProduction ? 'KHALTI_PAYMENT_PROD_URL' : 'KHALTI_PAYMENT_DEV_URL',
        );

        // read the Khalti secret key from env
        const secretKey = this.configService.getOrThrow<string>(
            'KHALTI_LIVE_SECRET_KEY',
        );

        // build the full initiate endpoint without double slashes
        const khaltiUrl = `${baseUrl.replace(/\/$/, '')}/epayment/initiate/`;

        // convert amount to paisa (integer) because Khalti requires paisa
        const amountInPaisa = Math.round(payload.amount * 100);

        // prepare request body according to Khalti API format
        const khaltiPayload = {
            amount: amountInPaisa,
            return_url: payload.return_url || 'http://localhost:5173/payment/verify',
            website_url: payload.website_url || 'http://localhost:5173/',
            purchase_order_id: payload.purchase_order_id || transactionId,
            purchase_order_name: payload.purchase_order_name || 'Payment',
            ...(payload.customer_name || payload.customer_email
                ? {
                      customer_info: {
                          name: payload.customer_name,
                          email: payload.customer_email,
                      },
                  }
                : {}),
        };

        // send POST request to Khalti initiate endpoint
        const response = await fetch(khaltiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Key ${secretKey}`,
            },
            body: JSON.stringify(khaltiPayload),
        });

        // parse the JSON body returned by Khalti
        const responseData = (await response.json()) as KhaltiInitiateResponse;

        if (!response.ok) {
            this.logger.error(
                `Khalti initiate failed (${response.status}): ${JSON.stringify(responseData)}`,
            );
            throw new BadGatewayException('Failed to initiate Khalti payment');
        }

        this.logger.log(
            `Khalti payment initiated for transaction ${transactionId} (pidx: ${responseData.pidx})`,
        );

        // return a standard result so callers do not depend on Khalti-specific keys
        return {
            transactionId,
            provider: this.method,
            providerRef: responseData.pidx,
            paymentUrl: responseData.payment_url,
            expiresAt: responseData.expires_at,
            rawResponse: responseData,
        };
    }

    async verifyPayment(_paymentId: string): Promise<VerifyPaymentResult> {
        // TODO: call Khalti /epayment/lookup/ API to verify payment status
        throw new Error('Khalti verifyPayment is not implemented yet');
    }

    async refundPayment(_paymentId: string, _amount: number): Promise<unknown> {
        // TODO: implement Khalti refund API call if needed
        throw new Error('Khalti refundPayment is not implemented yet');
    }
}
