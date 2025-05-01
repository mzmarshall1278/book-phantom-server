// src/auth/dto/login-auth.dto.ts
import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}