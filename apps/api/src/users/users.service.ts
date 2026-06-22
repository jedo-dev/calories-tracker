import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByTgUserId(tgUserId: number): Promise<UserDocument | null> {
    return this.userModel.findOne({ tgUserId }).exec();
  }

  async create(data: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async createOrUpdate(
    tgUserId: number,
    data: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        { tgUserId },
        {
          tgUserId,
          ...data,
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}

