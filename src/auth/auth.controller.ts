import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
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
    res.redirect("frontend app server/api/auth/google/callback?userId="+response.id+"&email="+response.email+"&accessToken="+response.accessToken)
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
}