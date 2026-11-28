import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/InitiatePaymentDto';
import { VerifyPaymentDto } from './dto/VerifyPaymentDto';
import type {
    InitiatePaymentResult,
    VerifyPaymentResult,
} from './interface/payment-provider.interface';

@Controller('payment')
export class PaymentController {
    // inject PaymentService to handle payment logic
    constructor(private readonly paymentService: PaymentService) {}

    // HTTP endpoint to initiate a payment directly
    @Post('initiate-payment')
    async initiatePayment(
        @Body() data: InitiatePaymentDto,
    ): Promise<InitiatePaymentResult> {
        // forward payload and payment method to the service
        return await this.paymentService.initiatePayment(
            data.payload,
            data.paymentMethod,
        );
    }

    // HTTP endpoint to verify a payment directly
    @Post('verify-payment')
    async verifyPayment(
        @Body() data: VerifyPaymentDto,
    ): Promise<VerifyPaymentResult> {
        // forward payment id and method to the service
        return await this.paymentService.verifyPayment(
            data.paymentId,
            data.paymentMethod,
        );
    }
}
