import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeasurementService } from './measurement.service';
import { MeasurementController } from './measurement.controller';
import { BodyMeasurement, BodyMeasurementSchema } from './schemas/body-measurement.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: BodyMeasurement.name, schema: BodyMeasurementSchema }])],
  controllers: [MeasurementController],
  providers: [MeasurementService],
  exports: [MeasurementService],
})
export class MeasurementModule {}
