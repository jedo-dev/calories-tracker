import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseLimit } from '../common/utils/query';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('follow/:userId')
  async follow(@Param('userId') userId: string, @Request() req: any) {
    await this.friendsService.follow(req.user.id, userId);
    return { ok: true };
  }

  @Delete('follow/:userId')
  async unfollow(@Param('userId') userId: string, @Request() req: any) {
    await this.friendsService.unfollow(req.user.id, userId);
    return { ok: true };
  }

  @Get('following')
  async getFollowing(@Query('limit') limit: string, @Request() req: any) {
    const limitNum = parseLimit(limit, 50);
    return this.friendsService.getFollowing(req.user.id, limitNum);
  }

  @Get('followers')
  async getFollowers(@Query('limit') limit: string, @Request() req: any) {
    const limitNum = parseLimit(limit, 50);
    return this.friendsService.getFollowers(req.user.id, limitNum);
  }
}
