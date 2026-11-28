import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PaymentModule } from './modules/payment/payment.module';
import { ProducerModule } from './modules/producer/producer.module';
import { ConsumerModule } from './modules/consumer/consumer.module';
import { MailerModule } from './modules/mailer/mailer.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PaymentModule,
        ProducerModule,
        ConsumerModule,
        MailerModule
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
