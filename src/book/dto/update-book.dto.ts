import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { BookStatus } from '../schemas/book.schema';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  language?: string;

  @IsObject()
  @IsOptional()
  dictionary: {
    characters: { id: string; value: string }[];
    places: { id: string; value: string }[];
    spells: { id: string; value: string }[];
    special: { id: string; value: string }[];
  };

  @IsOptional()
  status?: BookStatus;

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
