// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';


@Module({
  imports: [
    MailerModule.forRootAsync({ // Use forRootAsync for dynamic configuration
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          secure: configService.get('MAIL_SECURE') === 'true', // Use explicit comparison
          port: parseInt(configService.get('MAIL_PORT')!, 10),
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: {
            email: configService.get('MAIL_FROM'),
            name: configService.get('MAIL_FROM_NAME') || 'Book Phantom', // Provide a default if needed
          },
        },
        template: {
          dir: join(__dirname, 'templates'), // Path to your email templates
          adapter: new HandlebarsAdapter(), // Use Handlebars adapter
          options: {
            strict: true, // Handlebar options
          },
        },
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Export MailService
})
export class MailModule {}