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
    const queryFilter: any = {};

    if (search && search.trim()) {
      const searchNormalized = this.normalizeName(search);
      const escapedSearch = this.escapeRegex(searchNormalized);
      queryFilter.nameNormalized = { $regex: escapedSearch };
    }

    const products = await this.productModel
      .find({})
      // .limit((limit || 20) * 2)
      // .sort({ nameNormalized: 1 })
      .exec();

    // if (search && search.trim()) {
    //   const searchNormalized = this.normalizeName(search);
    //   const startsWith = products.filter((p) => p.nameNormalized.startsWith(searchNormalized));
    //   const contains = products.filter((p) => !p.nameNormalized.startsWith(searchNormalized));
    //   const sorted = [...startsWith, ...contains];
    //   return sorted.slice(0, limit || 20);
    // }

    return products.slice(0, limit || 20);
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
