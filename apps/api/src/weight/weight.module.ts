import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeightService } from './weight.service';
import { WeightController } from './weight.controller';
import { WeightLog, WeightLogSchema } from './schemas/weight-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeightLog.name, schema: WeightLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WeightController],
  providers: [WeightService],
  exports: [WeightService],
})
export class WeightModule {}
