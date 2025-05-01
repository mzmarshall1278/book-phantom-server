// src/auth/dto/social-auth.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class SocialAuthDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}