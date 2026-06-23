import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

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

    if (userId) {
      productData.createdBy = userId;
    }

    const product = new this.productModel(productData);
    return product.save();
  }
}
