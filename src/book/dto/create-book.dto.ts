import { IsNotEmpty, IsString, IsArray, IsBoolean, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  synopsis: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  genre: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsNotEmpty()
  @IsString()
  language: string;

  @IsObject()
  @IsOptional()
  dictionary: {
    characters: { id: string; value: string }[];
    places: { id: string; value: string }[];
    spells: { id: string; value: string }[];
    special: { id: string; value: string }[];
  };

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  ageRating?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  publishedDate?: string;
}