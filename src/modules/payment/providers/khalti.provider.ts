import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    InitiatePaymentPayload,
    InitiatePaymentResult,
    PaymentProvider,
    PaymentProviderInterface,
    PaymentStatus,
    VerifyPaymentResult,
} from '../interface/payment-provider.interface';
import {
    KhaltiErrorResponseDto,
    KhaltiInitiateResponseDto,
    KhaltiPaymentStatus,
    KhaltiResponseDto,
} from '../dto/Khalti/KhaltiResponseDto';

@Injectable()
export class KhaltiProvider implements PaymentProviderInterface {
    // mark this provider as Khalti
    readonly method = PaymentProvider.KHALTI;

    // logger for Khalti API calls and errors
    private readonly logger = new Logger(KhaltiProvider.name);

    // shared Khalti API configuration loaded once at startup
    private readonly baseUrl: string;
    private readonly secretKey: string;

    // inject ConfigService so we can safely read env variables
    constructor(private readonly configService: ConfigService) {
        // check if the app is running in production mode
        const isProduction =
            this.configService.get<string>('IS_PRODUCTION') === 'true';

        // pick the right Khalti base URL based on environment and trim any trailing slash
        const configuredUrl = this.configService.getOrThrow<string>(
            isProduction ? 'KHALTI_PAYMENT_PROD_URL' : 'KHALTI_PAYMENT_DEV_URL',
        );
        this.baseUrl = configuredUrl.replace(/\/$/, '');

        // read the Khalti secret key from env
        this.secretKey = this.configService.getOrThrow<string>(
            'KHALTI_LIVE_SECRET_KEY',
        );
    }

    async initiatePayment(
        payload: InitiatePaymentPayload,
        transactionId: string,
    ): Promise<InitiatePaymentResult> {
        // convert amount to paisa (integer) because Khalti requires paisa
        const amountInPaisa = Math.round(payload.amount * 100);

        // per Khalti docs, minimum payable amount is Rs. 10 (1000 paisa)
        if (!Number.isFinite(amountInPaisa) || amountInPaisa < 1000) {
            throw new BadRequestException(
                'Khalti amount must be at least Rs. 10 (1000 paisa)',
            );
        }

        // build the full Khalti initiate endpoint
        const khaltiUrl = `${this.baseUrl}/epayment/initiate/`;

        // include customer_info only when at least one customer field is provided
        const hasCustomerInfo = Boolean(
            payload.customer_name ||
                payload.customer_email ||
                payload.customer_phone,
        );

        // prepare request body according to Khalti
        const khaltiPayload = {
            amount: amountInPaisa,
            return_url:
                payload.return_url || 'http://localhost:5173/payment/verify',
            website_url: payload.website_url || 'http://localhost:5173/',
            purchase_order_id: payload.purchase_order_id || transactionId,
            purchase_order_name: payload.purchase_order_name || 'Payment',
            ...(hasCustomerInfo
                ? {
                      customer_info: {
                          ...(payload.customer_name
                              ? { name: payload.customer_name }
                              : {}),
                          ...(payload.customer_email
                              ? { email: payload.customer_email }
                              : {}),
                          ...(payload.customer_phone
                              ? { phone: payload.customer_phone }
                              : {}),
                      },
                  }
                : {}),
        };

        // send POST request to Khalti initiate endpoint
        const response = await fetch(khaltiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Key ${this.secretKey}`,
            },
            body: JSON.stringify(khaltiPayload),
        });

        // safely parse the response body
        const responseData = await this.parseJson<
            KhaltiInitiateResponseDto | KhaltiErrorResponseDto
        >(response);

        // handle non-2xx responses from Khalti
        if (!response.ok || !responseData || !('pidx' in responseData)) {
            this.logger.error(
                `Khalti initiate failed (${response.status}): ${JSON.stringify(responseData)}`,
            );

            // 400 from Khalti means invalid request payload (validation_error)
            if (response.status === 400) {
                throw new BadRequestException(
                    responseData || 'Invalid Khalti payment request',
                );
            }

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

    async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
        // reject blank pidx before calling Khalti
        if (!paymentId || !paymentId.trim()) {
            throw new BadRequestException('paymentId (pidx) is required');
        }

        // build the full Khalti lookup endpoint
        const khaltiUrl = `${this.baseUrl}/epayment/lookup/`;

        // call Khalti lookup API with the pidx to verify payment status
        const response = await fetch(khaltiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Key ${this.secretKey}`,
            },
            body: JSON.stringify({ pidx: paymentId }),
        });

        // safely parse the response body
        const responseData = await this.parseJson<
            KhaltiResponseDto | KhaltiErrorResponseDto
        >(response);

        // per Khalti docs, "Expired" and "User canceled" return HTTP 400 with a valid lookup body
        const isLookupPayload =
            responseData !== null &&
            'pidx' in responseData &&
            'status' in responseData;

        // treat as error only when response is not 2xx AND does not contain a lookup payload
        if ((!response.ok && response.status !== 400) || !isLookupPayload) {
            this.logger.error(
                `Khalti verify failed (${response.status}): ${JSON.stringify(responseData)}`,
            );

            // Khalti returns "Not found." when the pidx does not exist
            if (
                response.status === 404 ||
                (responseData &&
                    'detail' in responseData &&
                    responseData.detail === 'Not found.')
            ) {
                throw new NotFoundException(
                    `Khalti payment not found for pidx: ${paymentId}`,
                );
            }

            throw new BadGatewayException('Failed to verify Khalti payment');
        }

        // responseData is now verified to be a KhaltiResponseDto
        const lookupData = responseData as KhaltiResponseDto;

        this.logger.log(
            `Khalti payment verified for pidx ${paymentId} (status: ${lookupData.status})`,
        );

        // return a standard VerifyPaymentResult (amounts converted from paisa to NPR)
        return {
            provider: this.method,
            providerRef: lookupData.pidx,
            transactionId: lookupData.transaction_id,
            status: this.mapStatus(lookupData.status),
            amount: lookupData.total_amount / 100,
            fee: lookupData.fee / 100,
            refunded: lookupData.refunded,
            rawResponse: lookupData,
        };
    }

    async refundPayment(_paymentId: string, _amount: number): Promise<unknown> {
        // TODO: implement Khalti refund API call if needed
        throw new Error('Khalti refundPayment is not implemented yet');
    }

    // safely parse JSON so non-JSON error responses (like HTML 502 pages) do not crash
    private async parseJson<T>(response: Response): Promise<T | null> {
        try {
            return (await response.json()) as T;
        } catch {
            return null;
        }
    }

    // convert Khalti-specific status strings into our standard PaymentStatus enum
    private mapStatus(status: KhaltiPaymentStatus | string): PaymentStatus {
        // normalize casing because Khalti docs vary (e.g. "Partially Refunded" vs "Partially refunded")
        switch (status.toLowerCase()) {
            case KhaltiPaymentStatus.COMPLETED.toLowerCase():
                return PaymentStatus.COMPLETED;
            case KhaltiPaymentStatus.PENDING.toLowerCase():
            case KhaltiPaymentStatus.INITIATED.toLowerCase():
                return PaymentStatus.PENDING;
            case KhaltiPaymentStatus.EXPIRED.toLowerCase():
                return PaymentStatus.EXPIRED;
            case KhaltiPaymentStatus.REFUNDED.toLowerCase():
            case KhaltiPaymentStatus.PARTIALLY_REFUNDED.toLowerCase():
                return PaymentStatus.REFUNDED;
            case KhaltiPaymentStatus.USER_CANCELED.toLowerCase():
                return PaymentStatus.CANCELED;
            default:
                return PaymentStatus.FAILED;
        }
    }
}
