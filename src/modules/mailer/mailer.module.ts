import { Global, Module } from '@nestjs/common';
import { EmailService } from './mailer.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [EmailService],
    exports: [EmailService],
})
export class MailerModule {}