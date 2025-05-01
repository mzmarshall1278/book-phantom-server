// src/author/dto/update-author.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  penName?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;
}