// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(loginAuthDto: LoginAuthDto): Promise<any> {
    const user = await this.userService.findOneByEmail(loginAuthDto.email);

    if (user && user.password && (await bcrypt.compare(loginAuthDto.password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any): Promise<{ accessToken: string }> {
    const payload = { sub: user._id, email: user.email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async googleLogin(user: any): Promise<{ accessToken: string }> {
    return this.login(user);
  }

  async facebookLogin(user: any): Promise<{ accessToken: string }> {
    return this.login(user);
  }
}