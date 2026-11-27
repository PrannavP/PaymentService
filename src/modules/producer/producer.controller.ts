import { Body, Controller, Post } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ProducerDto } from './dto/producerDto';

@Controller('producer')
export class ProducerController {
    constructor(private readonly producerService: ProducerService) {}
    @Post('plan-link')
    async planLink(@Body() data: ProducerDto): Promise<any> {
        debugger;
        const response = await this.producerService.planLink(data);
        return response;
    };
};