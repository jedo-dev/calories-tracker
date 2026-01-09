import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByTgUserId(tgUserId: number): Promise<UserDocument | null> {
    return this.userModel.findOne({ tgUserId }).exec();
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

