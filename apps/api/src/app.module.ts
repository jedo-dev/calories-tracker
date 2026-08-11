import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AdminModule } from './admin/admin.module';
import { EntriesModule } from './entries/entries.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { SocialModule } from './social/social.module';
import { FriendsModule } from './friends/friends.module';
import { ProfileModule } from './profile/profile.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkoutModule } from './workouts/workout.module';
import { WaterModule } from './water/water.module';
import { WeightModule } from './weight/weight.module';
import { TemplateModule } from './templates/template.module';
import { MeasurementModule } from './measurements/measurement.module';
import { RecipesModule } from './recipes/recipes.module';
import { MealPlanModule } from './meal-plan/meal-plan.module';
import { StorageModule } from './storage/storage.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
    HealthModule,
    ProductsModule,
    EntriesModule,
    StatsModule,
    SocialModule,
    FriendsModule,
    ProfileModule,
    DashboardModule,
    WorkoutModule,
    WaterModule,
    WeightModule,
    TemplateModule,
    MeasurementModule,
    RecipesModule,
    MealPlanModule,
    StorageModule,
    AdminModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
