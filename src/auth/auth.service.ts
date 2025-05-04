// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { UserDocument } from 'src/user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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
      accessToken
    }
  }

  async generateTokens(user) {
    const payload = { sub: user.id, email: user.email };

    const [ accessToken ] = await Promise.all([
      this.jwtService.signAsync(payload),
    ]);

    return { accessToken }
  }

  async validateJWTUser (user) {
    const foundUser = await this.userService.findOneById(user.id);
    if(!foundUser) return new UnauthorizedException("User not found!");
    const currentUser = { id: foundUser.id, email: foundUser.email }; 
    return currentUser;
  }

  async googleLogin(user: any) {
    return this.login(user);
  }

  async facebookLogin(user: any) {
    return this.login(user);
  }
}
