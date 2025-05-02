// src/book/schemas/book.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Author } from '../../author/schema/author.schema';
import { User } from '../../user/schemas/user.schema';

export type BookDocument = HydratedDocument<Book>;

export enum BookStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true, _id: true })
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  synopsis: string;

  @Prop({ type: [String], required: true })
  genre: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  language: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Author' }], required: true })
  authors: Author[];

  @Prop({ type: String, enum: BookStatus, default: BookStatus.DRAFT })
  status: BookStatus;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  purchaseCount: number;

  @Prop({ type: Number, default: 0 })
  ratings: number; // Could be an average or a count, adjust as needed

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  comments: User[]; // Reference to user who commented

  @Prop({ type: String })
  ageRating: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  likes: User[];

  @Prop({ type: String })
  license: string;

  @Prop({ type: String })
  isbn: string;

  @Prop({ type: String })
  publishedDate: string;

  @Prop({ type: String })
  coverImageUrl: string;

  @Prop({ type: String })
  bannerImageUrl: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);