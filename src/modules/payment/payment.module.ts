import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { KhaltiProvider } from './providers/khalti.provider';

@Module({
    controllers: [PaymentController],
    // register PaymentService and payment providers so DI can inject them
    providers: [PaymentService, KhaltiProvider],
    // export PaymentService so other modules (like ConsumerModule) can use it
    exports: [PaymentService],
})
export class PaymentModule {}
