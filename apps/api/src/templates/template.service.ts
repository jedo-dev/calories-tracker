import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MealTemplate, MealTemplateDocument } from './schemas/meal-template.schema';

@Injectable()
export class TemplateService {
  constructor(@InjectModel(MealTemplate.name) private templateModel: Model<MealTemplateDocument>) {}

  async create(userId: string, name: string, items: any[], mealType?: string): Promise<MealTemplateDocument> {
    const totalKcal = items.reduce((s, i) => s + (i.kcal || 0), 0);
    const template = new this.templateModel({
      userId: new Types.ObjectId(userId),
      name,
      mealType: mealType || 'other',
      items,
      totalKcal: Math.round(totalKcal),
    });
    return template.save();
  }

  async createFromEntries(
    userId: string,
    name: string,
    entries: any[],
    mealType?: string,
  ): Promise<MealTemplateDocument> {
    const items = entries.map(e => ({
      productId: e.productId ? new Types.ObjectId(e.productId) : undefined,
      productName: e.productName,
      grams: e.grams,
      kcal: e.kcal,
      kcalPer100g: e.kcalPer100g,
    }));
    // when saving a logged meal as a template, inherit the meal type of its entries
    return this.create(userId, name, items, mealType || entries[0]?.mealType);
  }

  async list(userId: string): Promise<MealTemplateDocument[]> {
    return this.templateModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async delete(templateId: string, userId: string): Promise<void> {
    const tpl = await this.templateModel.findById(templateId).exec();
    if (!tpl) throw new NotFoundException();
    if (tpl.userId.toString() !== userId) throw new ForbiddenException();
    await tpl.deleteOne();
  }
}
