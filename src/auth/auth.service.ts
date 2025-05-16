// src/auth/auth.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { UserDocument } from 'src/user/schemas/user.schema';
import { AuthorService } from 'src/author/author.service';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly authorService: AuthorService,
    private readonly mailService: MailService
  ) {}

  async validateUser(loginAuthDto: LoginAuthDto): Promise<any> {
    const user: UserDocument | null = await this.userService.findOneByEmail(
      loginAuthDto.email,
    );

    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await verify(user.password!, loginAuthDto.password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailConfirmed)
      throw new UnauthorizedException('Please verify your email to continue');

    return { id: user._id, email: user.email, name: user.firstName+' '+user.lastName };
  }

  async login(user) {
    const { accessToken } = await this.generateTokens(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user',
      accessToken,
    };
  }

  async generateTokens(user) {
    const payload = { sub: user.id, email: user.email, name: user.name, role: 'user' };
    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(payload),
    ]);

    return { accessToken };
  }

  async validateJWTUser(payload: any) {
    const { sub } = payload;

    // if (role === 'user') {
      const foundUser = await this.userService.findOneById(sub);
      if (!foundUser) {
        throw new UnauthorizedException('User not found!');
      }
      return { id: foundUser.id, email: foundUser.email, role: 'user' };
    // } else if (role === 'author') {
    //   const foundAuthor = await this.authorService.findAuthorById(sub);
    //   if (!foundAuthor) {
    //     throw new UnauthorizedException('Author not found!');
    //   }
    //   return { id: foundAuthor.id, email: foundAuthor.email, role: 'author' };
    // } else {
    //   throw new UnauthorizedException('Invalid user role!');
    // }
  }

  async googleLogin(user: any) {
    return this.login(user);
  }

  async facebookLogin(user: any) {
    return this.login(user);
  }

  async confirmEmail(token: string, userId: string): Promise<void> {
    const user = await this.userService.findOneById(userId);
    if (user) {
      if (user.emailConfirmationToken !== token) {
        throw new UnauthorizedException('Invalid confirmation token.');
      }

      if (user.emailConfirmationTokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Confirmation token has expired.');
      }
      await this.userService.markEmailAsConfirmed(userId);
    }
  }

  async resendConfirmationEmail(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);

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
    await this.userService.updateConfirmationToken(
      user.id,
      newConfirmationToken,
      newExpiration,
    );
    // Send email
    await this.mailService.sendUserConfirmation(user, 'user');
  }
}
