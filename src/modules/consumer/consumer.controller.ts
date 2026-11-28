import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmailService } from '../mailer/mailer.service';
import { ProducerDto } from '../producer/dto/producerDto';

@Controller('consumer')
export class ConsumerController {
    // logger for incoming RabbitMQ events
    private readonly logger = new Logger(ConsumerController.name);

    // inject EmailService to notify customers
    constructor(private readonly emailService: EmailService) {}

    // listen for subscription_plan_link events from RabbitMQ
    @EventPattern('subscription_plan_link')
    async handlePlanLinkEvent(data: ProducerDto): Promise<void> {
        // log the incoming event payload
        this.logger.log(
            `Received subscription_plan_link event for ${data.customer_email}`,
        );

        // prepare recipient email and subject
        const to = data.customer_email;
        const subject = 'Subscribed to the plan';

        // build a simple HTML email body
        const html = `
            <div>
                <h2>Subscription Confirmed</h2>
                <p>Hi ${data.customer_name},</p>
                <p>Thank you for subscribing${data.purchase_order_name ? ` to <strong>${data.purchase_order_name}</strong>` : ' to the plan'}.</p>
                <p><strong>Amount:</strong> ${data.amount}</p>
                ${data.purchase_order_id ? `<p><strong>Order ID:</strong> ${data.purchase_order_id}</p>` : ''}
                <p>We appreciate your business!</p>
            </div>
        `;

        // send the email via Resend
        await this.emailService.sendEmail(to, subject, html);
    }
};