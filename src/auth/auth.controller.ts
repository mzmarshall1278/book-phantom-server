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
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: any): Promise<{ accessToken: string }> {
    return this.authService.login(req.user); // req.user will be populated by LocalStrategy on successful validation
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates the Google OAuth 2.0 flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any, res: Response) {
    const response = await this.authService.googleLogin(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(
      frontendUrl +
        '/api/auth/google/callback?userId=' +
        response.id +
        '&email=' +
        response.email +
        '&accessToken=' +
        response.accessToken,
    );
  }

  // @Get('facebook')
  // @UseGuards(FacebookAuthGuard)
  // async facebookAuth() {
  //   // Initiates the Facebook OAuth 2.0 flow
  // }

  // @Get('facebook/callback')
  // @UseGuards(FacebookAuthGuard)
  // async facebookAuthRedirect(@Req() req: any): Promise<{ accessToken: string }> {
  //   return this.authService.facebookLogin(req.user);
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
      await this.authService.confirmEmail(token, userId);
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
      await this.authService.resendConfirmationEmail(email);
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
