import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserDocument } from '../user/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { AuthorDocument } from 'src/author/schema/author.schema';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendUserConfirmation(user: UserDocument | AuthorDocument, role: 'user' | 'author'): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    let confirmationLink = `${frontendUrl}/auth/confirm?token=${user.emailConfirmationToken}&userId=${user._id}`;
    if (role === 'author') {
      confirmationLink = `${frontendUrl}/auth/author/confirm?token=${user.emailConfirmationToken}&userId=${user._id}`;
    }

    try {
      const emailRes = await this.mailerService.sendMail({
      to: user.email,
      subject: 'Confirm Your Email Address',
      template: 'confirmation', // You'll need to create this template
      context: {
        firstName: user.firstName,
        lastName: user.lastName, // Or user's name if available
        url: confirmationLink,
      },
    });
    console.log(emailRes);
    return emailRes;
    } catch (error) {
      console.log('**************',error);
      throw new InternalServerErrorException('Unable to send mail.')
    }
  }

    async sendResetPasswordEmail(user: UserDocument | AuthorDocument, token: string, role: 'user' | 'author'): Promise<void> {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const resetLink = `${frontendUrl}/auth/reset-password?token=${token}&userId=${user._id}&role=${role}`;

      await this.mailerService.sendMail({
          to: user.email,
          subject: 'Reset Your Password',
          template: 'reset-password', // Create this template
          context: {
              name: user.email,
              url: resetLink,
          }
      });
  }
}