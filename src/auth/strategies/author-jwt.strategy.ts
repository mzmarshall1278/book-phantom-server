import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthorAuthService } from '../author-auth.service';

@Injectable()
export class AuthorJwtStrategy extends PassportStrategy(Strategy, 'author-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authorAuthService: AuthorAuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined!');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    return this.authorAuthService.validateJWTAuthor(payload.sub); // Create this method
  }
}