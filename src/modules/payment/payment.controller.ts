import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/InitiatePaymentDto';
import { InitiatePaymentResult } from './interface/payment-provider.interface';

@Controller('payment')
export class PaymentController {
    // inject PaymentService to handle payment logic
    constructor(private readonly paymentService: PaymentService) {}

    // HTTP endpoint to initiate a payment directly
    @Post('initiate-payment')
    async initiatePayment(@Body() data: InitiatePaymentDto): Promise<InitiatePaymentResult> {
        // forward payload and payment method to the service
        return await this.paymentService.initiatePayment(
            data.payload,
            data.paymentMethod,
        );
    };
};