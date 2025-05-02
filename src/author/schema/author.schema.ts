// src/author/schemas/author.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema'; // Import User schema

export type AuthorDocument = HydratedDocument<Author>;

@Schema({ timestamps: true })
export class Author {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId: User; // Reference to the User

  @Prop({ required: true, unique: true })
  penName: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  profileImageUrl?: string; 

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, refPath: 'followerModel' }], default: [] })
  followers: (User | Author)[];

  @Prop({ type: [String], default: [] })
  followerModel: ('User' | 'Author')[]; // To specify the model for each follower

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Author' }], default: [] })
  following: Author[];

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;

}

export const AuthorSchema = SchemaFactory.createForClass(Author);