import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";


@Controller('consumer')
export class ConsumerController {
    @EventPattern('subscription_plan_link')
    async handlePlanLinkEvent(data: any): Promise<void> {
        console.log('Received subscription plan link event:', data);
        // Add your logic to handle the event here
    }
};