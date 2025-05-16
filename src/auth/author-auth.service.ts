// src/auth/auth.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { AuthorService } from 'src/author/author.service';
import { AuthorDocument } from 'src/author/schema/author.schema';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthorAuthService {
  constructor(
    private readonly authorService: AuthorService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validateAuthor(loginAuthDto: LoginAuthDto): Promise<any> {
    const author: AuthorDocument | null =
      await this.authorService.findAuthorByEmail(loginAuthDto.email);

    if (!author) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await verify(
      author.password!,
      loginAuthDto.password,
    );

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');
    if (!author.isEmailConfirmed)
      throw new UnauthorizedException('Please verify your email to continue');

    return {
      id: author._id,
      email: author.email,
      name: author.firstName + ' ' + author.lastName,
    };
  }

  async login(author) {
    const { accessToken } = await this.generateTokens(author);
    return {
      id: author.id,
      email: author.email,
      accessToken,
      name: author.name,
      role: 'author',
    };
  }

  async generateTokens(author) {
    const payload = {
      sub: author.id,
      email: author.email,
      name: author.name,
      role: 'author',
    };

    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(payload),
    ]);

    return { accessToken };
  }

  async validateJWTAuthor(author) {
    const foundUser = await this.authorService.findAuthorById(author);
    if (!foundUser) throw new UnauthorizedException('User not found!');
    const currentUser = { id: foundUser.id, email: foundUser.email };
    return currentUser;
  }

  async googleLogin(author: any) {
    return this.login(author);
  }

  async facebookLogin(author: any) {
    return this.login(author);
  }

  async resendConfirmationEmail(email: string): Promise<void> {
    const user = await this.authorService.findAuthorByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isEmailConfirmed) {
      throw new UnauthorizedException('Email already confirmed.');
    }
    // Generate new token and expiration
    const newConfirmationToken = uuidv4();
    const newExpiration = new Date();
    newExpiration.setDate(newExpiration.getDate() + 1);

    // Update user with new token
    await this.authorService.updateConfirmationToken(
      user.id,
      newConfirmationToken,
      newExpiration,
    );
    // Send email
    await this.mailService.sendUserConfirmation(user, 'author');
  }

  async confirmEmail(token: string, userId: string): Promise<void> {
    const user = await this.authorService.findAuthorById(userId);
    if (user) {
      if (user.emailConfirmationToken !== token) {
        throw new UnauthorizedException('Invalid confirmation token.');
      }

      if (user.emailConfirmationTokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Confirmation token has expired.');
      }
      await this.authorService.markEmailAsConfirmed(userId);
    }
  }
}
