import { Controller, Get, Post, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(
    private achievementsService: AchievementsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get()
  async getMyAchievements(@Request() req: any) {
    return this.achievementsService.getUserAchievements(req.user.id);
  }

  @Get(':userId/public')
  async getUserAchievements(@Param('userId') userId: string, @Request() req: any) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      return [];
    }
    if (user.isPublicProfile === false && userId !== req.user.id) {
      throw new ForbiddenException('Profile is private');
    }
    return this.achievementsService.getUserAchievements(userId);
  }

  @Post('check')
  async checkAchievements(@Request() req: any) {
    const newlyUnlocked = await this.achievementsService.checkAndUnlock(req.user.id);
    return { ok: true, newlyUnlocked };
  }
}
