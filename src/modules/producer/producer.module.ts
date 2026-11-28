import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProducerService } from './producer.service';
import { ProducerController } from './producer.controller';

@Module({
    imports: [
        // register the RabbitMQ client using ConfigService so credentials stay in .env
        ClientsModule.registerAsync([
            {
                name: 'RABBITMQ_SERVICE',
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        // read RabbitMQ connection string from .env
                        urls: [
                            configService.getOrThrow<string>('RABBITMQ_CONNECTION_STRING'),
                        ],
                        // queue name shared between producer and consumer
                        queue: 'subscription_plan_queue',
                        queueOptions: {
                            // keep queue alive even if RabbitMQ restarts
                            durable: true,
                        },
                    },
                }),
            },
        ]),
    ],
    controllers: [ProducerController],
    providers: [ProducerService],
})
export class ProducerModule {}
