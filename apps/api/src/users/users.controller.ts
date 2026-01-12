import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FriendsService } from '../friends/friends.service';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService, private friendsService: FriendsService) {}

  @Get('search')
  async search(@Query('query') query: string, @Query('limit') limit: string, @Request() req: any) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.friendsService.searchUsers(query, req.user.id, limitNum);
  }
}
