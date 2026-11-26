import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/InitiatePaymentDto';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('initiate-payment')
    async initiatePayment(@Body() data: InitiatePaymentDto): Promise<any> {
        debugger;
        const response = await this.paymentService.initiatePayment(data.payload, data.paymentMethod,);

        return response;
    }
};