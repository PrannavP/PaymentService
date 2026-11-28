import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '../interface/payment-provider.interface';

export class VerifyPaymentDto {
    // reference id returned by the payment provider (e.g., Khalti pidx)
    @ApiProperty({
        example: '3KqEedCBdVEykYVupQRqV2',
        description: 'Payment ID returned by the payment provider',
    })
    paymentId: string;

    // payment gateway used to process the payment
    @ApiProperty({
        description: 'Payment provider name',
        enum: PaymentProvider,
        example: PaymentProvider.KHALTI,
    })
    paymentMethod: PaymentProvider;
}
