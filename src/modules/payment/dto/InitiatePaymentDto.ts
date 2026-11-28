import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '../interface/payment-provider.interface';
import type { InitiatePaymentPayload } from '../interface/payment-provider.interface';

export class InitiatePaymentDto {
    // payment details sent to the selected provider
    @ApiProperty({
        description: 'Payment payload details',
        type: Object,
        example: {
            amount: 1000,
            purchase_order_id: 'ORDER-12345',
            purchase_order_name: 'Subscription Plan',
            return_url: 'http://localhost:5173/payment/khalti/verify',
            website_url: 'http://localhost:5173/',
            customer_name: 'John Doe',
            customer_email: 'john.doe@example.com',
        },
    })
    payload: InitiatePaymentPayload;

    // chosen payment gateway (e.g., khalti)
    @ApiProperty({
        description: 'Payment method',
        enum: PaymentProvider,
        example: PaymentProvider.KHALTI,
    })
    paymentMethod: PaymentProvider;
}
