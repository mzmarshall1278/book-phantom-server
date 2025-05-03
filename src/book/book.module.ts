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

@Module({
  imports: [MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]), AuthorModule, LibraryModule, PaypalModule, TransactionModule],
  controllers: [BookController],
  providers: [BookService, S3Service],
})
export class BookModule {}