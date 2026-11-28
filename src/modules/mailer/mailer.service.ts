import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

/**
 * EmailService is a service class that provides email-related functionalities.
 */

@Injectable()
export class EmailService {
    private readonly resend: Resend;
    private readonly logger = new Logger(EmailService.name);
    private readonly from: string;

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(
            this.configService.getOrThrow<string>('RESEND_API_KEY'),
        );

        this.from = this.configService.getOrThrow<string>('MAIL_FROM');
    }

    // function to send email
    async sendEmail(to: string, subject: string, html: string){
        const { data, error } = await this.resend.emails.send({from: this.from, to, subject, html});

        if (error) {
            this.logger.error(`Email sending failed: ${error.message}`);
            throw new InternalServerErrorException('Failed to send email');
        }

        this.logger.log(`Email sent successfully: ${data.id}`);

        return data;
    };
};