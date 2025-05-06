import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Book } from '../../book/schemas/book.schema';
import { Author } from '../../author/schema/author.schema'; // Import Author schema if you want to type authors

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ required: true })
  chapterTitle: string;

  @Prop({ required: true })
  chapterText: string;

  @Prop({ required: true })
  chapterNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Book;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Author' }], default: [] })
  authors: Author[]; // Array of author IDs

  @Prop({ type: Object })
  processedContent: any; // The JSON output of your algorithm

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);