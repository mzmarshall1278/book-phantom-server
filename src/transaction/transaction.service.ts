// src/transaction/transaction.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(
    userId: string,
    bookId: string,
    paypalOrderId: string,
    paymentStatus: string,
    amount: number,
    payerId?: string,
  ): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel({
      userId,
      bookId,
      paypalOrderId,
      paymentStatus,
      amount,
      payerId,
    });
    return createdTransaction.save();
  }

  // You can add methods here to find transactions by user, book, or order ID, etc.
}