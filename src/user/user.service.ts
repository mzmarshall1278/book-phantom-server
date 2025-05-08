// src/user/user.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user = await this.findOneByEmail(createUserDto.email);
    if (user) throw new ConflictException('User already exists.');
    const hashedPassword = await hash(createUserDto.password);
    const emailConfirmationToken = uuidv4();
    const emailConfirmationTokenExpiresAt = new Date();
    emailConfirmationTokenExpiresAt.setDate(
      emailConfirmationTokenExpiresAt.getDate() + 1,
    );

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      emailConfirmationToken,
      emailConfirmationTokenExpiresAt,
    });
    const savedUser = await createdUser.save();

    await this.mailService.sendUserConfirmation(savedUser, 'user');

    return savedUser;
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // async findByConfirmationToken(token: string): Promise<UserDocument | null> {
  //   return this.userModel.findOne({ emailConfirmationToken: token, emailConfirmationTokenExpiresAt: { $gt: new Date() } }).exec();
  // }

  async markEmailAsConfirmed(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          isEmailConfirmed: true,
          $unset: {
            emailConfirmationToken: 1,
            emailConfirmationTokenExpiresAt: 1,
          },
        },
        { new: true },
      )
      .exec();
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
      isEmailConfirmed: true,
    });

    const savedUser = await newUser.save();

    return savedUser;
  }

  async findOrCreateFacebookUser(profile: any): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ facebookId: profile.id })
      .exec();
    if (user) {
      return user;
    }
    const newUser = new this.userModel({
      facebookId: profile.id,
      email: profile.emails ? profile.emails[0].value : null,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      isEmailConfirmed: true,
    });
    return newUser.save();
  }

  async updateConfirmationToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          emailConfirmationToken: token,
          emailConfirmationTokenExpiresAt: expires,
        },
        { new: true },
      )
      .exec();
  }
}
