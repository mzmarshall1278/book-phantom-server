import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthorService } from '../../author/author.service';

@Injectable()
export class GoogleAuthorStrategy extends PassportStrategy(Strategy, 'google-author') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authorService: AuthorService,
  ) {
    const googleClientId = configService.get<string>('GOOGLE_CLIENT_ID_AUTHOR') || configService.get<string>('GOOGLE_CLIENT_ID');
    const googleClientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET_AUTHOR') || configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!googleClientId || !googleClientSecret) {
      throw new Error('Google Author Environment variables are missing');
    }
    super({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: 'http://localhost:3000/auth/author/google/callback', // Different callback URL
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const author = await this.authorService.findOrCreateGoogleAuthor({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      password: '',
    });
    done(null, author);
  }
}