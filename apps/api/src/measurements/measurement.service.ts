import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BodyMeasurement, BodyMeasurementDocument } from './schemas/body-measurement.schema';

@Injectable()
export class MeasurementService {
  constructor(@InjectModel(BodyMeasurement.name) private model: Model<BodyMeasurementDocument>) {}

  async save(userId: string, date: string, data: Partial<BodyMeasurement>): Promise<BodyMeasurementDocument> {
    return this.model.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date },
      { ...data },
      { upsert: true, new: true },
    ).exec();
  }

  async getHistory(userId: string, limit = 90): Promise<BodyMeasurementDocument[]> {
    return this.model.find({ userId: new Types.ObjectId(userId) }).sort({ date: -1 }).limit(limit).exec();
  }
}
