import { Body, Controller, Post } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ProducerDto } from './dto/producerDto';

// test-only controller to simulate messages coming from the main application
@Controller('producer')
export class ProducerController {
    // inject ProducerService to publish test events to RabbitMQ
    constructor(private readonly producerService: ProducerService) {}

    // endpoint to publish a test subscription plan link message
    @Post('plan-link')
    async planLink(@Body() data: ProducerDto) {
        // emit the message to RabbitMQ and return the result
        return await this.producerService.planLink(data);
    }
};