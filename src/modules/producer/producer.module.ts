import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProducerService } from './producer.service';
import { ProducerController } from './producer.controller';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'RABBITMQ_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://admin:admin123@localhost:5672'],
                    queue: 'subscription_plan_queue',
                    queueOptions: {
                        durable: true, // Ensures queue survives broker restarts
                    },
                },
            },
        ]),
    ],
    controllers: [ProducerController],
    providers: [ProducerService],
})
export class ProducerModule { };