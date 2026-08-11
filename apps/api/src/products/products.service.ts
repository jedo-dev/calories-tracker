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

    // Двухфазный поиск вместо неякорного $regex с перевыборкой ×3 и сортировкой
    // в JS (это был полный скан коллекции на каждый ввод символа):
    // 1) якорный ^prefix — идёт по индексу nameNormalized; сортировка по нему же
    //    даёт тот же порядок, что старый ранкер (точное → префикс → алфавит).
    const prefixMatches = await this.productModel
      .find({ nameNormalized: { $regex: `^${escapedSearch}` } })
      .sort({ nameNormalized: 1 })
      .limit(maxResults)
      .exec();

    if (prefixMatches.length >= maxResults) {
      return prefixMatches;
    }

    // 2) Добираем подстрочные совпадения (не начинающиеся с запроса) — только
    //    когда префиксных не хватило; substring-семантика поиска сохранена.
    const substringMatches = await this.productModel
      .find({
        nameNormalized: {
          $regex: escapedSearch,
          $not: new RegExp(`^${escapedSearch}`),
        },
      })
      .sort({ nameNormalized: 1 })
      .limit(maxResults - prefixMatches.length)
      .exec();

    return [...prefixMatches, ...substringMatches];
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    // Раньше отдавали 200 с пустым телом.
    if (!product) throw new NotFoundException('Продукт не найден');
    return product;
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
