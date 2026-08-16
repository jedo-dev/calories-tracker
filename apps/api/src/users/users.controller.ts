import { Body, Controller, Delete, Get, Param, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FriendsService } from '../friends/friends.service';
import { UsersService } from './users.service';
import { RecipesService } from '../recipes/recipes.service';
import { QueryUserRecipesDto } from '../recipes/dto/query-user-recipes.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private friendsService: FriendsService,
    private recipesService: RecipesService,
  ) {}

  // Полное удаление аккаунта; пароль — подтверждение владельца
  @Delete('me')
  async deleteMe(@Body() body: any, @Request() req: any) {
    await this.usersService.deleteAccount(req.user.id, body?.password);
    return { ok: true };
  }

  @Get('search')
  async search(@Query('query') query: string, @Query('limit') limit: string, @Request() req: any) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.friendsService.searchUsers(query, req.user.id, limitNum);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getPublicProfile(id, req.user.id);
  }

  @Get(':id/recipes')
  async getUserRecipes(
    @Param('id') id: string,
    @Query(ValidationPipe) query: QueryUserRecipesDto,
    @Request() req: any,
  ) {
    return this.recipesService.getUserRecipes(id, query, req.user.id);
  }
}
