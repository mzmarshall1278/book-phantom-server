// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
    const createdUser = new this.userModel({ ...createUserDto, password: hashedPassword });
    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findOrCreateGoogleUser(profile: any): Promise<UserDocument> {
    const user = await this.userModel.findOne({ googleId: profile.id }).exec();
    if (user) {
      return user;
    }
    const newUser = new this.userModel({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
    });
    return newUser.save();
  }

  async findOrCreateFacebookUser(profile: any): Promise<UserDocument> {
    const user = await this.userModel.findOne({ facebookId: profile.id }).exec();
    if (user) {
      return user;
    }
    const newUser = new this.userModel({
      facebookId: profile.id,
      email: profile.emails ? profile.emails[0].value : null,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
    });
    return newUser.save();
  }
}