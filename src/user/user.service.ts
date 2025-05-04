// src/user/user.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'argon2';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user = await this.findOneByEmail(createUserDto.email);
    if(user) throw new ConflictException('User already exists.')
    const hashedPassword = await hash(createUserDto.password);
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
    const user = await this.userModel.findOne({ email: profile.email }).exec();
    if (user) {
      return user;
    }
    const newUser = new this.userModel({
      googleId: profile.googleid,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
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