// src/library/library.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LibraryService } from './library.service';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Book, BookSchema } from '../book/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
