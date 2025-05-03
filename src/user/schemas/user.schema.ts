// src/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Author } from 'src/author/schema/author.schema';
import { BookDocument } from 'src/book/schemas/book.schema';

export type UserDocument = HydratedDocument<User> & {
  library: BookDocument[]; // Explicitly define the type after population
};


@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  googleId?: string;

  @Prop()
  facebookId?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Author' }], default: [] })
  followingAuthors: Author[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Book' }], default: [] })
  library: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);