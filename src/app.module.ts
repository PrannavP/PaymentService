import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PaymentModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
