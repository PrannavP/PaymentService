import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProducerService implements OnModuleInit {
    constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}
    
    async onModuleInit() {
        try {
            await this.client.connect();
        } catch (error: unknown) {
            const reason =
                typeof error === 'object' && error !== null && 'err' in error
                    ? (error as { err: unknown }).err
                    : error;
            console.error('Failed to connect to RabbitMQ:', reason);
            throw reason; // remove this line if you want the app to boot even when RabbitMQ is down
        }
    };

    // fire and forget method to send a message to the RabbitMQ service
    async planLink(payload: any): Promise<any> {
        const response = this.client.emit('subscription_plan_link', payload);

        return response;
    };
};