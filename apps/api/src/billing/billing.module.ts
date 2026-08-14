import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { BillingController } from './billing.controller';
import { PremiumService } from './premium.service';
import { PremiumCode, PremiumCodeSchema } from './schemas/premium-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PremiumCode.name, schema: PremiumCodeSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [PremiumService],
  exports: [PremiumService],
})
export class BillingModule {}
