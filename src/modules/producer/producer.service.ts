import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ProducerDto } from './dto/producerDto';

@Injectable()
export class ProducerService implements OnModuleInit {
    // logger for RabbitMQ producer status and errors
    private readonly logger = new Logger(ProducerService.name);

    // inject the RabbitMQ client registered in ProducerModule
    constructor(
        @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
    ) {}

    // connect to RabbitMQ when this module starts
    async onModuleInit(): Promise<void> {
        try {
            // establish connection to RabbitMQ broker
            await this.client.connect();
            this.logger.log('Connected to RabbitMQ');
        } catch (error: unknown) {
            // unwrap nested error if amqp-connection-manager wraps it in { err }
            const reason =
                typeof error === 'object' && error !== null && 'err' in error
                    ? (error as { err: unknown }).err
                    : error;

            this.logger.error('Failed to connect to RabbitMQ', reason);
            // stop app startup if RabbitMQ is not reachable
            throw reason;
        }
    };

    // send a fire-and-forget event to the RabbitMQ queue
    async planLink(payload: ProducerDto): Promise<{ message: string }> {
        // emit returns an Observable, so await lastValueFrom to ensure it is sent
        await lastValueFrom(
            this.client.emit('subscription_plan_link', payload),
        );

        // return a clear confirmation response
        return { message: 'Subscription plan link event published' };
    }
}
