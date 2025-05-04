import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, UnauthorizedException, Res } from '@nestjs/common';
import { AuthorAuthService } from './author-auth.service';
import { GoogleAuthorAuthGuard } from './guards/google-author-auth.guard';
import { AuthorLocalAuthGuard } from './guards/author-local-auth.guard';
import { Response } from 'express';

@Controller('auth/author')
export class AuthorAuthController {
  constructor(private readonly authorAuthService: AuthorAuthService) {}

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
    res.redirect("frontend app server/api/auth/author/google/callback?userId="+response.id+"&email="+response.email+"&accessToken="+response.accessToken)
  }

  // @Get('facebook')
  // @UseGuards(FacebookAuthorAuthGuard)
  // async facebookAuth() {}

  // @Get('facebook/callback')
  // @UseGuards(FacebookAuthorAuthGuard)
  // async facebookAuthRedirect(@Req() req: any): Promise<{ accessToken: string }> {
  //   return this.authorAuthService.facebookLogin(req.user);
  // }
}