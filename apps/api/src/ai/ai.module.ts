import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingModule } from '../billing/billing.module';
import { AiQuotaService } from './ai-quota.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import {
  AiBalance,
  AiBalanceSchema,
  AiPromoCode,
  AiPromoCodeSchema,
  AiQuota,
  AiQuotaSchema,
} from './schemas/ai-quota.schema';

@Module({
  imports: [
    BillingModule,
    MongooseModule.forFeature([
      { name: AiQuota.name, schema: AiQuotaSchema },
      { name: AiBalance.name, schema: AiBalanceSchema },
      { name: AiPromoCode.name, schema: AiPromoCodeSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, AiQuotaService],
})
export class AiModule {}
