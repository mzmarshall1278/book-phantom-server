// src/transaction/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Book', required: true })
  bookId: string;

  @Prop({ required: true })
  paypalOrderId: string;

  @Prop({ required: true })
  paymentStatus: string;

  @Prop()
  payerId?: string;

  @Prop()
  amount: number;

  // Add other relevant transaction details as needed
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);