// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { AuthorService } from 'src/author/author.service';
import { AuthorDocument } from 'src/author/schema/author.schema';

@Injectable()
export class AuthorAuthService {
  constructor(
    private readonly authorService: AuthorService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAuthor(loginAuthDto: LoginAuthDto): Promise<any> {
    const author: AuthorDocument | null = await this.authorService.findAuthorByEmail(
      loginAuthDto.email,
    );

    if (!author) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await verify(author.password!, loginAuthDto.password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return { id: author._id, name: author.email };
  }

  async login(author) {
    const { accessToken } = await this.generateTokens(author);
    return {
      id: author.id,
      email: author.email,
      accessToken,
      role: 'author'
    }
  }

  async generateTokens(author) {
    const payload = { sub: author.id, email: author.email, role: 'author' };

    const [ accessToken ] = await Promise.all([
      this.jwtService.signAsync(payload),
    ]);

    return { accessToken }
  }

  async validateJWTAuthor (author) {
    const foundUser = await this.authorService.findAuthorById(author);
    if(!foundUser) return new UnauthorizedException("User not found!");
    const currentUser = { id: foundUser.id, email: foundUser.email}; 
    return currentUser;
  }

  async googleLogin(author: any) {
    return this.login(author);
  }

  async facebookLogin(author: any) {
    return this.login(author);
  }
}
