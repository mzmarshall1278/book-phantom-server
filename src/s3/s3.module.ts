// src/s3/s3.module.ts
import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Import ConfigModule if S3Service depends on it
  providers: [S3Service],
  exports: [S3Service], // Make S3Service available to other modules
})
export class S3Module {}