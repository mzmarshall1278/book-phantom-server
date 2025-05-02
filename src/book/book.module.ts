import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from './schemas/book.schema';
import { S3Service } from '../s3/s3.service';
import { AuthorModule } from '../author/author.module'; // Import AuthorModule to ensure AuthorGuard works

@Module({
  imports: [MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]), AuthorModule],
  controllers: [BookController],
  providers: [BookService, S3Service],
})
export class BookModule {}