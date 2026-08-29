import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RecognizedFoodItem {
  name: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface FoodPhotoResult {
  items: RecognizedFoodItem[];
  mealTypeGuess: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
}

const TIMEOUT_MS = 60_000;

// Короткие ключи в JSON ответа модели — экономия выходных токенов
// (их цена в ~5 раз выше входных).
const RESPONSE_FORMAT =
  'Отвечай ТОЛЬКО компактным JSON без markdown и пояснений: ' +
  '{"items":[{"n":"название по-русски","g":вес порции в граммах,"k":ккал на 100г,"p":белки,"f":жиры,"c":углеводы,"cf":"h|m|l"}],"meal":"breakfast|lunch|dinner|snack"} ' +
  'p/f/c — граммы на 100г. cf — уверенность в оценке веса. ';

const PHOTO_SYSTEM_PROMPT =
  'Ты определяешь еду на фото для дневника калорий. ' +
  RESPONSE_FORMAT +
  'Вес оценивай по видимым ориентирам (тарелка ~24 см, приборы, руки). ' +
  'Если еды на фото нет: {"items":[],"meal":null}';

const TEXT_SYSTEM_PROMPT =
  'Ты превращаешь описание съеденного (обычно надиктованное голосом) в записи дневника калорий. ' +
  RESPONSE_FORMAT +
  'Распознавание речи искажает слова — восстанавливай названия блюд по смыслу. ' +
  'Если вес или объём порции назван — используй его (стакан ~250 мл, ложка ~15 г, кусок хлеба ~30 г), ' +
  'иначе бери типичную порцию и ставь cf:"l". ' +
  'Если еды в тексте нет: {"items":[],"meal":null}';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  async recognizeFoodPhoto(imageBase64: string, mediaType = 'image/jpeg'): Promise<FoodPhotoResult> {
    return this.requestRecognition(PHOTO_SYSTEM_PROMPT, [
      {
        type: 'image_url',
        image_url: { url: `data:${mediaType};base64,${imageBase64}` },
      },
      { type: 'text', text: 'Что на фото?' },
    ]);
  }

  async recognizeFoodText(text: string): Promise<FoodPhotoResult> {
    return this.requestRecognition(TEXT_SYSTEM_PROMPT, [{ type: 'text', text }]);
  }

  private async requestRecognition(systemPrompt: string, userContent: unknown[]): Promise<FoodPhotoResult> {
    const apiKey = this.config.get<string>('AI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('AI recognition is not configured');
    }
    const baseUrl = this.config.get<string>('AI_BASE_URL') || 'https://polza.ai/api/v1';
    const model = this.config.get<string>('AI_MODEL') || 'anthropic/claude-sonnet-4.5';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_tokens: 700,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(`AI provider error ${res.status}: ${text.slice(0, 500)}`);
        throw new BadGatewayException('AI provider request failed');
      }

      const data: any = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';
      return this.parseModelResponse(content);
    } catch (err: any) {
      if (err instanceof BadGatewayException || err instanceof ServiceUnavailableException) throw err;
      if (err?.name === 'AbortError') {
        throw new BadGatewayException('AI provider timeout');
      }
      this.logger.error(`AI request failed: ${err?.message || err}`);
      throw new BadGatewayException('AI provider request failed');
    } finally {
      clearTimeout(timer);
    }
  }

  private parseModelResponse(content: string): FoodPhotoResult {
    // Модель иногда заворачивает JSON в ```-фенсы — вырезаем первый {...последний}
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end <= start) {
      this.logger.warn(`Unparseable AI response: ${content.slice(0, 300)}`);
      throw new BadGatewayException('AI response is not valid JSON');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content.slice(start, end + 1));
    } catch {
      this.logger.warn(`Bad JSON from AI: ${content.slice(0, 300)}`);
      throw new BadGatewayException('AI response is not valid JSON');
    }

    const rawItems: any[] = Array.isArray(parsed?.items) ? parsed.items : [];
    const items: RecognizedFoodItem[] = rawItems
      .map((it) => ({
        name: String(it?.n ?? '').trim().slice(0, 120),
        grams: this.clamp(it?.g, 1, 3000),
        kcalPer100g: this.clamp(it?.k, 0, 900),
        proteinPer100g: this.clamp(it?.p, 0, 100),
        fatPer100g: this.clamp(it?.f, 0, 100),
        carbPer100g: this.clamp(it?.c, 0, 100),
        confidence: it?.cf === 'h' ? ('high' as const) : it?.cf === 'l' ? ('low' as const) : ('medium' as const),
      }))
      .filter((it) => it.name && it.grams !== null && it.kcalPer100g !== null)
      .map((it) => ({
        ...it,
        grams: it.grams as number,
        kcalPer100g: it.kcalPer100g as number,
        proteinPer100g: it.proteinPer100g ?? 0,
        fatPer100g: it.fatPer100g ?? 0,
        carbPer100g: it.carbPer100g ?? 0,
      }));

    const meal = parsed?.meal;
    const mealTypeGuess = ['breakfast', 'lunch', 'dinner', 'snack'].includes(meal) ? meal : null;

    return { items, mealTypeGuess };
  }

  private clamp(value: any, min: number, max: number): number | null {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return Math.min(max, Math.max(min, Math.round(num * 10) / 10));
  }
}
