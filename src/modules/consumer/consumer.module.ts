import { Module } from '@nestjs/common';
import { ConsumerController } from './consumer.controller';

@Module({
    imports: [],
    // register ConsumerController so NestJS attaches its @EventPattern handlers
    controllers: [ConsumerController],
    providers: [],
})
export class ConsumerModule {};