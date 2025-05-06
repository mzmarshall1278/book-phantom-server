// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { UserDocument } from 'src/user/schemas/user.schema';
import { AuthorService } from 'src/author/author.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly authorService: AuthorService
  ) {}

  async validateUser(loginAuthDto: LoginAuthDto): Promise<any> {
    const user: UserDocument | null = await this.userService.findOneByEmail(
      loginAuthDto.email,
    );

    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await verify(user.password!, loginAuthDto.password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return { id: user._id, name: user.email };
  }

  async login(user) {
    const { accessToken } = await this.generateTokens(user);
    return {
      id: user.id,
      email: user.email,
      role: 'user',
      accessToken
    }
  }

  async generateTokens(user) {
    const payload = { sub: user.id, email: user.email, role: 'user' };

    const [ accessToken ] = await Promise.all([
      this.jwtService.signAsync(payload),
    ]);

    return { accessToken }
  }

  async validateJWTUser(payload: any) {
    const { sub, role } = payload;

    if (role === 'user') {
      const foundUser = await this.userService.findOneById(sub);
      if (!foundUser) {
        throw new UnauthorizedException('User not found!');
      }
      return { id: foundUser.id, email: foundUser.email, role: 'user' };
    } else if (role === 'author') {
      const foundAuthor = await this.authorService.findAuthorById(sub);
      if (!foundAuthor) {
        throw new UnauthorizedException('Author not found!');
      }
      return { id: foundAuthor.id, email: foundAuthor.email, role: 'author' };
    } else {
      throw new UnauthorizedException('Invalid user role!');
    }
  }

  async googleLogin(user: any) {
    return this.login(user);
  }

  async facebookLogin(user: any) {
    return this.login(user);
  }
}
