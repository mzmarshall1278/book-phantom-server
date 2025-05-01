// src/author/author.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Author, AuthorDocument } from './schema/author.schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UserDocument } from '../user/schemas/user.schema'; // Import UserDocument
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(Author.name) private readonly authorModel: Model<AuthorDocument>,
  ) {}

  async createAuthor(userId: UserDocument, createAuthorDto: CreateAuthorDto): Promise<AuthorDocument> {
    // Check if the user is already an author
    const existingAuthor = await this.authorModel.findOne({ userId: userId._id }).exec();
    if (existingAuthor) {
      throw new BadRequestException('User is already an author');
    }

    const newAuthor = new this.authorModel({
      userId: userId._id, // Use the user's ID
      penName: createAuthorDto.penName,
      country: createAuthorDto.country,
      city: createAuthorDto.city,
      followersCount: 0,
      followingCount: 0,
    });
    return newAuthor.save();
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
}