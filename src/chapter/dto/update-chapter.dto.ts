import { IsOptional, IsString, IsMongoId, IsBoolean } from 'class-validator';

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  chapterTitle?: string;

  @IsOptional()
  @IsString()
  chapterText?: string;

  @IsOptional()
  @IsMongoId()
  bookId?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}