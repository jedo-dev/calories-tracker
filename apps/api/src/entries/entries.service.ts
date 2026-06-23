import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entry, EntryDocument } from './schemas/entry.schema';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { SocialService } from '../social/social.service';

@Injectable()
export class EntriesService {
  constructor(
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private socialService: SocialService,
  ) {}

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private calculateTotals(
    grams: number,
    kcalPer100g: number,
    proteinPer100g: number,
    fatPer100g: number,
    carbPer100g: number,
  ) {
    const factor = grams / 100;
    return {
      kcal: this.round(kcalPer100g * factor),
      protein: this.round(proteinPer100g * factor),
      fat: this.round(fatPer100g * factor),
      carb: this.round(carbPer100g * factor),
    };
  }

  async create(createEntryDto: CreateEntryDto, userId: string): Promise<EntryDocument> {
    const product = await this.productModel.findById(createEntryDto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const totals = this.calculateTotals(
      createEntryDto.grams,
      product.kcalPer100g,
      product.proteinPer100g,
      product.fatPer100g,
      product.carbPer100g,
    );

    const entryData = {
      userId: new Types.ObjectId(userId),
      date: createEntryDto.date,
      time: createEntryDto.time,
      mealType: createEntryDto.mealType || 'other',
      productId: new Types.ObjectId(createEntryDto.productId),
      productName: product.name,
      grams: createEntryDto.grams,
      kcalPer100g: product.kcalPer100g,
      proteinPer100g: product.proteinPer100g,
      fatPer100g: product.fatPer100g,
      carbPer100g: product.carbPer100g,
      ...totals,
    };

    const entry = new this.entryModel(entryData);
    const savedEntry = await entry.save();

    try {
      const stats = await this.socialService.ensureUserStats(userId);
      this.socialService.maybeResetWeek(stats);
      await this.socialService.updateStreakIfFirstLogOfDay(userId, createEntryDto.date);
      await this.socialService.grantXpForEntry(userId, createEntryDto.date);
    } catch (err) {
      console.error('Failed to grant XP/update streak:', err);
    }

    return savedEntry;
  }

  async listByDate(date: string, userId: string): Promise<EntryDocument[]> {
    const entries = await this.entryModel
      .find({
        userId: new Types.ObjectId(userId),
        date,
      })
      .sort({ createdAt: 1 })
      .exec();

    return entries.sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  }

  async getById(id: string, userId: string): Promise<EntryDocument> {
    const entry = await this.entryModel.findById(id).exec();
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }
    if (entry.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return entry;
  }

  async update(
    id: string,
    updateEntryDto: UpdateEntryDto,
    userId: string,
  ): Promise<EntryDocument> {
    const entry = await this.getById(id, userId);

    let product = null;
    if (updateEntryDto.productId) {
      product = await this.productModel.findById(updateEntryDto.productId);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const updatedGrams = updateEntryDto.grams !== undefined ? updateEntryDto.grams : entry.grams;
    const updatedKcalPer100g = product ? product.kcalPer100g : entry.kcalPer100g;
    const updatedProteinPer100g = product ? product.proteinPer100g : entry.proteinPer100g;
    const updatedFatPer100g = product ? product.fatPer100g : entry.fatPer100g;
    const updatedCarbPer100g = product ? product.carbPer100g : entry.carbPer100g;

    const totals = this.calculateTotals(
      updatedGrams,
      updatedKcalPer100g,
      updatedProteinPer100g,
      updatedFatPer100g,
      updatedCarbPer100g,
    );

    const updateData: any = {
      ...(updateEntryDto.date && { date: updateEntryDto.date }),
      ...(updateEntryDto.time !== undefined && { time: updateEntryDto.time }),
      ...(updateEntryDto.mealType && { mealType: updateEntryDto.mealType }),
      ...(updateEntryDto.grams !== undefined && { grams: updateEntryDto.grams }),
      ...totals,
    };

    if (product) {
      updateData.productId = new Types.ObjectId(updateEntryDto.productId);
      updateData.productName = product.name;
      updateData.kcalPer100g = product.kcalPer100g;
      updateData.proteinPer100g = product.proteinPer100g;
      updateData.fatPer100g = product.fatPer100g;
      updateData.carbPer100g = product.carbPer100g;
    }

    entry.set(updateData);
    return entry.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const entry = await this.getById(id, userId);
    await entry.deleteOne();
  }

  async getRecentEntries(userId: string, limit: number = 5): Promise<any[]> {
    const entries = await this.entryModel
      .find({ 
        userId: new Types.ObjectId(userId),
        productId: { $exists: true, $ne: null }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .exec();

    const seen = new Map<string, any>();
    for (const entry of entries) {
      const pid = entry.productId?.toString();
      if (pid && !seen.has(pid)) {
        seen.set(pid, {
          productId: pid,
          productName: entry.productName,
          grams: entry.grams,
          kcal: entry.kcal,
          kcalPer100g: entry.kcalPer100g,
          proteinPer100g: entry.proteinPer100g,
          fatPer100g: entry.fatPer100g,
          carbPer100g: entry.carbPer100g,
          lastUsed: (entry as any).createdAt || new Date().toISOString(),
        });
      }
    }

    return Array.from(seen.values()).slice(0, limit);
  }
}

