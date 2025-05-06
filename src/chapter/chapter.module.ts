import { Module } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorJwtAuthGuard } from '../auth/guards/author-jwt-auth.guard';
import { BookModule } from '../book/book.module'; // Import BooksModule for dependency with Book
import { S3Service } from '../s3/s3.service';
import { ChapterProcessingService } from './chapter-processing.service'; // Assuming you named the file this
import { ChapterAccessGuard } from './guards/chapter-access.guard';
import { ChapterRequestService } from './chapter-request.service';
import { LibraryModule } from 'src/library/library.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chapter.name, schema: ChapterSchema }]),
    BookModule, // Ensure BooksService is available if needed for validation
    LibraryModule,
    JwtModule.registerAsync({
      // <---------------------- CONFIRM THIS CONFIGURATION
      useFactory: async () => ({
        secret: process.env.JWT_SECRET, // Replace with your actual secret key
        signOptions: { expiresIn: '1h' }, // Example options
      }),
    }),
  ],
  controllers: [ChapterController],
  providers: [
    ChapterService,
    JwtAuthGuard,
    AuthorJwtAuthGuard,
    S3Service,
    ChapterProcessingService,
    ChapterAccessGuard,
    ChapterRequestService,
  ],
  exports: [ChapterService], // Export if other modules need to access ChaptersService
})
export class ChapterModule {}
