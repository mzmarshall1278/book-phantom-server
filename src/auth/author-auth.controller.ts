import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  UnauthorizedException,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthorAuthService } from './author-auth.service';
import { GoogleAuthorAuthGuard } from './guards/google-author-auth.guard';
import { AuthorLocalAuthGuard } from './guards/author-local-auth.guard';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth/author')
export class AuthorAuthController {
  constructor(
    private readonly authorAuthService: AuthorAuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthorLocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any): Promise<{ accessToken: string }> {
    return this.authorAuthService.login(req.user);
  }

  @Get('google')
  @UseGuards(GoogleAuthorAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthorAuthGuard)
  async googleAuthRedirect(@Req() req: any, res: Response) {
    const response = await this.authorAuthService.googleLogin(req.user);
    res.redirect(
      'frontend app server/api/auth/author/google/callback?userId=' +
        response.id +
        '&email=' +
        response.email +
        '&accessToken=' +
        response.accessToken,
    );
  }

  // @Get('facebook')
  // @UseGuards(FacebookAuthorAuthGuard)
  // async facebookAuth() {}

  // @Get('facebook/callback')
  // @UseGuards(FacebookAuthorAuthGuard)
  // async facebookAuthRedirect(@Req() req: any): Promise<{ accessToken: string }> {
  //   return this.authorAuthService.facebookLogin(req.user);
  // }

  @Get('confirm') //  route for email confirmation
  async confirmEmail(
    @Query('token') token: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token || !userId) {
      throw new BadRequestException('Token and User ID are required.');
    }
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    try {
      await this.authorAuthService.confirmEmail(token, userId);
      // Redirect to a success page on your frontend
      res.redirect(`your-frontend-app/email-confirmed`); // Adjust the URL as needed
    } catch (error) {
      if (error instanceof UnauthorizedException)
        res.redirect(
          `${frontendUrl}/email-confirmation-failed?message=${error.message}`,
        );
      else
        res.redirect(
          `${frontendUrl}/email-confirmation-failed?message=An error occurred`,
        );
    }
  }

  @Post('resend-confirmation-email')
  async resendConfirmationEmail(
    @Body('email') email: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    try {
      await this.authorAuthService.resendConfirmationEmail(email);
      res.status(HttpStatus.OK).send({ message: 'Confirmation email sent.' });
    } catch (error) {
      if (error instanceof UnauthorizedException)
        res.redirect(
          `${frontendUrl}/email-confirmation-failed?message=${error.message}`,
        );
      else
        res.redirect(
          `${frontendUrl}/email-confirmation-failed?message=An error occurred`,
        );
    }
  }
}
