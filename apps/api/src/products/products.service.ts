import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { OpenFoodFactsService } from './openfoodfacts.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private openFoodFacts: OpenFoodFactsService,
  ) {}

  normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findAll(query: QueryProductsDto): Promise<ProductDocument[]> {
    const { search, limit } = query;
    const maxResults = limit || 20;

    if (!search || !search.trim()) {
      return this.productModel.find().limit(maxResults).exec();
    }

    const searchNormalized = this.normalizeName(search);
    const escapedSearch = this.escapeRegex(searchNormalized);

    const filter = { nameNormalized: { $regex: escapedSearch } };

    const all = await this.productModel.find(filter).limit(maxResults * 3).exec();

    all.sort((a, b) => {
      const aN = a.nameNormalized;
      const bN = b.nameNormalized;
      const aExact = aN === searchNormalized ? 0 : 1;
      const bExact = bN === searchNormalized ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aStarts = aN.startsWith(searchNormalized) ? 0 : 1;
      const bStarts = bN.startsWith(searchNormalized) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aN.localeCompare(bN);
    });

    return all.slice(0, maxResults);
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).exec();
  }

  // Our catalog first; on a miss, ask Open Food Facts and cache the answer
  // locally so the next scan of the same product works offline.
  async findByBarcode(barcode: string): Promise<any> {
    const normalized = (barcode || '').trim();
    if (!/^\d{6,14}$/.test(normalized)) {
      return { found: false, barcode: normalized };
    }

    const existing = await this.productModel.findOne({ barcode: normalized }).exec();
    if (existing) {
      return { found: true, ...existing.toObject(), origin: 'local' };
    }

    const off = await this.openFoodFacts.findByBarcode(normalized);
    if (!off) {
      return { found: false, barcode: normalized };
    }

    const saved = await this.productModel
      .findOneAndUpdate(
        { barcode: normalized },
        {
          $setOnInsert: {
            name: off.name,
            nameNormalized: this.normalizeName(off.name),
            brand: off.brand,
            barcode: normalized,
            kcalPer100g: off.kcalPer100g,
            proteinPer100g: off.proteinPer100g,
            fatPer100g: off.fatPer100g,
            carbPer100g: off.carbPer100g,
            source: 'OFF',
            sourceId: normalized,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    return { found: true, ...saved.toObject(), origin: 'openfoodfacts' };
  }

  async create(createProductDto: CreateProductDto, userId?: string): Promise<ProductDocument> {
    const nameNormalized = this.normalizeName(createProductDto.name);
    const productData: any = {
      name: createProductDto.name.trim().replace(/\s+/g, ' '),
      nameNormalized,
      kcalPer100g: createProductDto.kcalPer100g,
      proteinPer100g: createProductDto.proteinPer100g || 0,
      fatPer100g: createProductDto.fatPer100g || 0,
      carbPer100g: createProductDto.carbPer100g || 0,
      source: 'USER',
    };

    if (createProductDto.barcode) {
      productData.barcode = createProductDto.barcode;
      productData.source = 'BARCODE';
    }

    if (createProductDto.brand) {
      productData.brand = createProductDto.brand;
    }

    if (userId) {
      productData.createdBy = userId;
    }

    const product = new this.productModel(productData);
    return product.save();
  }

  async update(id: string, dto: UpdateProductDto, userId: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.createdBy && product.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own products');
    }

    const updateData: any = {};
    if (dto.name !== undefined) {
      updateData.name = dto.name.trim().replace(/\s+/g, ' ');
      updateData.nameNormalized = this.normalizeName(dto.name);
    }
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.kcalPer100g !== undefined) updateData.kcalPer100g = dto.kcalPer100g;
    if (dto.proteinPer100g !== undefined) updateData.proteinPer100g = dto.proteinPer100g;
    if (dto.fatPer100g !== undefined) updateData.fatPer100g = dto.fatPer100g;
    if (dto.carbPer100g !== undefined) updateData.carbPer100g = dto.carbPer100g;

    product.set(updateData);
    return product.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.createdBy && product.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }
    await product.deleteOne();
  }
}
