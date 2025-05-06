// src/auth/strategies/jwt.strategy.ts
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
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
    try {
      return this.authService.validateJWTUser({
        sub: payload.sub,
        role: payload.role,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw the UnauthorizedException
      }
      // Handle other potential errors here (e.g., database issues)
      console.error('Error validating JWT user:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
