import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from './stats.controller';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Entry.name, schema: EntrySchema }])],
  controllers: [StatsController],
})
export class StatsModule {}

