// src/author/dto/create-author.dto.ts
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class CreateAuthorDto {
  @IsNotEmpty()
  @IsString()
  penName: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}