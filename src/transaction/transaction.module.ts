// src/transaction/transaction.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }])],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}