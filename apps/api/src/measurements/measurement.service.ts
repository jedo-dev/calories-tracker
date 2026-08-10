import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BodyMeasurement, BodyMeasurementDocument } from './schemas/body-measurement.schema';

@Injectable()
export class MeasurementService {
  constructor(@InjectModel(BodyMeasurement.name) private model: Model<BodyMeasurementDocument>) {}

  async save(userId: string, date: string, data: Partial<BodyMeasurement>): Promise<BodyMeasurementDocument> {
    // Явный список полей: userId/date из тела не должны попадать в $set.
    const update = {
      waistCm: data.waistCm,
      hipsCm: data.hipsCm,
      chestCm: data.chestCm,
      bicepCm: data.bicepCm,
      thighCm: data.thighCm,
    };
    return this.model.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date },
      { $set: update },
      { upsert: true, new: true },
    ).exec();
  }

  async getHistory(userId: string, limit = 90): Promise<BodyMeasurementDocument[]> {
    return this.model.find({ userId: new Types.ObjectId(userId) }).sort({ date: -1 }).limit(limit).exec();
  }

  async delete(id: string, userId: string): Promise<void> {
    const entry = await this.model.findById(id).exec();
    if (!entry) {
      throw new NotFoundException('Measurement entry not found');
    }
    if (entry.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    await entry.deleteOne();
  }
}
