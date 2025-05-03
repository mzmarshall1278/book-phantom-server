// src/author/author.service.ts
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Author, AuthorDocument } from './schema/author.schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { User, UserDocument } from '../user/schemas/user.schema'; // Import UserDocument
import { UpdateAuthorDto } from './dto/update-author.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(Author.name) private readonly authorModel: Model<AuthorDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createAuthor(createAuthorDto: CreateAuthorDto): Promise<AuthorDocument> {
    const { email, ...rest } = createAuthorDto;
    const existingAuthor = await this.authorModel.findOne({ email }).exec();
    if (existingAuthor) {
      throw new ConflictException('Author with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createAuthorDto.password, 10);
    const createdAuthor = new this.authorModel({ ...rest, email, passwordHash: hashedPassword });
    return createdAuthor.save();
  }

  async findAuthorByUserId(userId: string | Types.ObjectId): Promise<AuthorDocument | null> {
    return this.authorModel.findOne({ userId }).exec();
  }

  async updateAuthor(userId: string | Types.ObjectId, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDocument> {
    const existingAuthor = await this.findAuthorByUserId(userId);
    if (!existingAuthor) {
      throw new NotFoundException('Author not found for this user');
    }
    Object.assign(existingAuthor, updateAuthorDto);
    return existingAuthor.save();
  }

  async updateAuthorProfileImage(userId: string | Types.ObjectId, profileImageUrl: string): Promise<AuthorDocument> {
    const existingAuthor = await this.findAuthorByUserId(userId);
    if (!existingAuthor) {
      throw new NotFoundException('Author not found for this user');
    }
    existingAuthor.profileImageUrl = profileImageUrl;
    return existingAuthor.save();
  }

  async followAuthor(userId: string, authorId: string): Promise<void> {
    if (userId === authorId) {
      throw new BadRequestException('Users cannot follow themselves.');
    }

    const authorToFollow = await this.authorModel.findById(authorId).exec();
    const user = await this.userModel.findById(userId).exec();

    if (!authorToFollow) {
      throw new NotFoundException('Author to follow not found.');
    }

    if (!user) {
      throw new NotFoundException('User not found.');
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

  async findAuthorById(id: string): Promise<AuthorDocument | null> {
    return this.authorModel.findById(id).exec();
  }

  async unfollowAuthor(userId: string, authorId: string): Promise<void> {
    if (userId === authorId) {
      throw new BadRequestException('Users cannot unfollow themselves.');
    }

    const authorToUnfollow = await this.authorModel.findById(authorId).exec();
    const user = await this.userModel.findById(userId).exec();

    if (!authorToUnfollow) {
      throw new NotFoundException('Author to unfollow not found.');
    }

    if (!user) {
      throw new NotFoundException('User not found.');
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