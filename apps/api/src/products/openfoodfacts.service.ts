import { Injectable, Logger } from '@nestjs/common';

export interface OffProduct {
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
}

const API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'product_name,product_name_ru,brands,nutriments';
const TIMEOUT_MS = 8000;
// Open Food Facts asks API clients to identify themselves
const USER_AGENT = 'FlareonFit/1.0 (personal non-commercial calorie tracker)';

@Injectable()
export class OpenFoodFactsService {
  private readonly logger = new Logger(OpenFoodFactsService.name);

  async findByBarcode(barcode: string): Promise<OffProduct | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      if (!res.ok) return null;

      const data: any = await res.json();
      if (data.status !== 1 || !data.product) return null;

      const p = data.product;
      const n = p.nutriments || {};
      const name: string = (p.product_name_ru || p.product_name || '').trim();
      const kcal = this.kcalPer100g(n);
      // a product without a name or calories is useless for the diary
      if (!name || kcal === null) return null;

      return {
        name,
        brand: (p.brands || '').split(',')[0].trim() || undefined,
        kcalPer100g: this.round(kcal),
        proteinPer100g: this.round(this.num(n.proteins_100g)),
        fatPer100g: this.round(this.num(n.fat_100g)),
        carbPer100g: this.round(this.num(n.carbohydrates_100g)),
      };
    } catch (error) {
      this.logger.warn(`Open Food Facts lookup failed for ${barcode}: ${(error as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private num(value: unknown): number {
    const n = Number(value);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  // some products only carry kJ — convert those
  private kcalPer100g(n: any): number | null {
    const kcal = Number(n['energy-kcal_100g']);
    if (isFinite(kcal) && kcal > 0) return kcal;
    const kj = Number(n['energy-kj_100g'] ?? n.energy_100g);
    if (isFinite(kj) && kj > 0) return kj / 4.184;
    return null;
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
