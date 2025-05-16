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
  NotFoundException,
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
    try {
      await this.authorAuthService.confirmEmail(token, userId);
      res.status(HttpStatus.OK).json({ message: 'Email confirmed.' });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: error.message });
      } else if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred' });
      }
    }
  }

 @Post('resend-confirmation-email')
  async resendConfirmationEmail(@Body('email') email: string, @Res() res: Response) {
    try {
      await this.authorAuthService.resendConfirmationEmail(email);
      res.status(HttpStatus.OK).json({ message: 'Confirmation email sent.' });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: error.message });
      } else if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred' });
      }
    }
  }
}
