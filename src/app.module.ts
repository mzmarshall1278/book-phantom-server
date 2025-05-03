// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthorModule } from './author/author.module';
import { S3Module } from './s3/s3.module';
import { BookModule } from './book/book.module';
import { LibraryModule } from './library/library.module';
import { PaypalModule } from './paypal/paypal.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    AuthorModule,
    S3Module,
    BookModule,
    LibraryModule,
    PaypalModule,
    TransactionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}