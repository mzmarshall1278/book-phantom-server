import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from './schemas/book.schema';
import { S3Service } from '../s3/s3.service';
import { AuthorModule } from '../author/author.module'; // Import AuthorModule to ensure AuthorGuard works
import { LibraryModule } from 'src/library/library.module';
import { PaypalModule } from 'src/paypal/paypal.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { Chapter, ChapterSchema } from 'src/chapter/schemas/chapter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema }, 
      { name: Chapter.name, schema: ChapterSchema
       }, 
    ]),
    AuthorModule,
    LibraryModule,
    PaypalModule,
    TransactionModule,
  ],
  controllers: [BookController],
  providers: [BookService, S3Service],
  exports: [BookService, MongooseModule],
})
export class BookModule {}
