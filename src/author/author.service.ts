// src/author/author.service.ts
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Author, AuthorDocument } from './schema/author.schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { User, UserDocument } from '../user/schemas/user.schema'; // Import UserDocument
import { UpdateAuthorDto } from './dto/update-author.dto';
import { hash } from 'argon2';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(Author.name) private readonly authorModel: Model<AuthorDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

 async createAuthor(createAuthorDto: CreateAuthorDto) {
     const author = await this.findAuthorByEmail(createAuthorDto.email);
     if(author) throw new ConflictException('User already exists.')
     const hashedPassword = await hash(createAuthorDto.password);
     const createdAuthor = new this.authorModel({ ...createAuthorDto, password: hashedPassword });
     return createdAuthor.save();
   }
 
   async findOrCreateGoogleAuthor(profile: any) {
     const author = await this.authorModel.findOne({ email: profile.email }).exec();
     if (author) {
       return author;
     }
     const newAuthor = new this.authorModel({
       googleId: profile.googleid,
       email: profile.email,
       firstName: profile.firstName,
       lastName: profile.lastName,
     });
     return newAuthor.save();
   }
 
   async findOrCreateFacebookAuthor(profile: any) {
     const user = await this.authorModel.findOne({ facebookId: profile.id }).exec();
     if (user) {
       return user;
     }
     const newAuthor = new this.authorModel({
       facebookId: profile.id,
       email: profile.emails ? profile.emails[0].value : null,
       firstName: profile.name.givenName,
       lastName: profile.name.familyName,
     });
     return newAuthor.save();
   }

  // async findAuthorByUserId(userId: string | Types.ObjectId): Promise<AuthorDocument | null> {
  //   return this.authorModel.findOne({ userId }).exec();
  // }

  async updateAuthor(id: string | Types.ObjectId, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDocument> {
    const existingAuthor = await this.findAuthorById(id);
    if (!existingAuthor) {
      throw new NotFoundException('Author not found for this user');
    }
    Object.assign(existingAuthor, updateAuthorDto);
    return existingAuthor.save();
  }

  async updateAuthorProfileImage(id: string | Types.ObjectId, profileImageUrl: string): Promise<AuthorDocument> {
    const existingAuthor = await this.findAuthorById(id);
    if (!existingAuthor) {
      throw new NotFoundException('Author not found for this user');
    }
    existingAuthor.profileImageUrl = profileImageUrl;
    return existingAuthor.save();
  }

  async followAuthor(userId: string, authorId: string): Promise<void> {
    if (userId === authorId) {
      throw new BadRequestException('You know you cant do that right?');
    }

    const authorToFollow = await this.authorModel.findById(authorId).exec();

    if (!authorToFollow) {
      throw new NotFoundException('You know you cant do that right?');
    }

    await this.authorModel.findByIdAndUpdate(
      authorId,
      { $addToSet: { followers: userId }, $inc: { followersCount: 1 } },
      { new: true }
    ).exec();

    await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { followingAuthors: authorId } }
    ).exec();
  }

  async findAuthorByEmail(email: string): Promise<AuthorDocument | null> {
    return this.authorModel.findOne({ email }).exec();
  }

  async findAuthorById(id: string | Types.ObjectId): Promise<AuthorDocument | null> {
    return this.authorModel.findById(id).exec();
  }

  async unfollowAuthor(userId: string, authorId: string): Promise<void> {
    if (userId === authorId) {
      throw new BadRequestException('Users cannot unfollow themselves.');
    }

    const authorToUnfollow = await this.authorModel.findById(authorId).exec();

    if (!authorToUnfollow) {
      throw new NotFoundException('Author to unfollow not found.');
    }

    await this.authorModel.findByIdAndUpdate(
      authorId,
      { $pull: { followers: userId }, $inc: { followersCount: -1 } }
    ).exec();

    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { followingAuthors: authorId } }
    ).exec();
  }
}