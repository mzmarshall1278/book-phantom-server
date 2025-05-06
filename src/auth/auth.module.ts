// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthorAuthService } from './author-auth.service';
import { GoogleAuthorStrategy } from './strategies/google-author.strategy';
import { AuthorJwtStrategy } from './strategies/author-jwt.strategy';
import { AuthorLocalStrategy } from './strategies/author-local.strategy';
import { AuthorModule } from 'src/author/author.module';
import { AuthorAuthController } from './author-auth.controller';

@Module({
  imports: [
    UserModule,
    AuthorModule,
    PassportModule,
    JwtModule.registerAsync({ // Configuration for regular user JWT
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    GoogleStrategy,
    FacebookStrategy,
    JwtStrategy,
    LocalStrategy,
    AuthorAuthService,
    GoogleAuthorStrategy,
    AuthorJwtStrategy,
    AuthorLocalStrategy,
  ], // Make sure JwtStrategy is here
  controllers: [AuthController, AuthorAuthController],
  exports: [],
})
export class AuthModule {}
