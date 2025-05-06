import { IsNotEmpty, IsString, IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class CreateChapterDto {
  @IsNotEmpty()
  @IsString()
  chapterTitle: string;

  @IsNotEmpty()
  @IsString()
  chapterText: string;

  @IsNotEmpty()
  @IsString()
  chapterNumber: string;

  @IsNotEmpty()
  @IsMongoId()
  bookId: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}