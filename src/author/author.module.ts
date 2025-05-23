// src/author/author.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorService } from './author.service';
import { AuthorController } from './author.controller';
import { Author, AuthorSchema } from './schema/author.schema';
import { S3Module } from 'src/s3/s3.module';
import { UserModule } from 'src/user/user.module';
import { S3Service } from 'src/s3/s3.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
    S3Module,
    UserModule,
    MailModule,
  ],
  providers: [AuthorService, S3Service],
  controllers: [AuthorController],
  exports: [AuthorService],
})
export class AuthorModule {}
