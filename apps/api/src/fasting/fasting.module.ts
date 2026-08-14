import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialModule } from '../social/social.module';
import { FastingController } from './fasting.controller';
import { FastingService } from './fasting.service';
import { FastingSession, FastingSessionSchema } from './schemas/fasting-session.schema';

@Module({
  imports: [
    SocialModule,
    MongooseModule.forFeature([{ name: FastingSession.name, schema: FastingSessionSchema }]),
  ],
  controllers: [FastingController],
  providers: [FastingService],
})
export class FastingModule {}
