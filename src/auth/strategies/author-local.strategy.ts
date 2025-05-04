import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthorAuthService } from '../author-auth.service'; // Create this service

@Injectable()
export class AuthorLocalStrategy extends PassportStrategy(Strategy, 'author-local') {
  constructor(private authorAuthService: AuthorAuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    if (password === "") throw new UnauthorizedException('provide a password');
    return this.authorAuthService.validateAuthor({ email, password }); // Create this method
  }
}