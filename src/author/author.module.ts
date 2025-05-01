// src/author/author.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorService } from './author.service';
import { AuthorController } from './author.controller';
import { Author, AuthorSchema } from './schema/author.schema';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]), S3Module],
  providers: [AuthorService],
  controllers: [AuthorController],
})
export class AuthorModule {}