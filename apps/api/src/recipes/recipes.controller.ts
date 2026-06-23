import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { QueryBoardDto } from './dto/query-board.dto';
import { QueryUserRecipesDto } from './dto/query-user-recipes.dto';
import { CreateEntryFromRecipeDto } from './dto/create-entry-from-recipe.dto';

const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads', 'recipes');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  async findAll(@Query(ValidationPipe) query: QueryRecipesDto, @Request() req: any) {
    return this.recipesService.findAll(query, req.user.id);
  }

  @Get('board')
  async getBoard(@Query(ValidationPipe) query: QueryBoardDto, @Request() req: any) {
    return this.recipesService.getBoard(query, req.user.id);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.findByIdPublic(id, req.user.id);
  }

  @Post()
  async create(@Body(ValidationPipe) dto: CreateRecipeDto, @Request() req: any) {
    return this.recipesService.create(dto, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateRecipeDto,
    @Request() req: any,
  ) {
    return this.recipesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  async archive(@Param('id') id: string, @Request() req: any) {
    await this.recipesService.archive(id, req.user.id);
    return { ok: true };
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.duplicate(id, req.user.id);
  }

  @Post(':id/create-entry')
  async createEntry(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CreateEntryFromRecipeDto,
    @Request() req: any,
  ) {
    return this.recipesService.createEntryFromPublic(id, dto, req.user.id);
  }

  @Post(':id/unarchive')
  async unarchive(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.unarchive(id, req.user.id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.publish(id, req.user.id);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.unpublish(id, req.user.id);
  }

  @Post(':id/fork')
  async fork(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.fork(id, req.user.id);
  }

  @Post(':id/like')
  async like(@Param('id') id: string, @Request() req: any) {
    return this.recipesService.toggleLike(id, req.user.id);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG, WebP images are allowed'), false);
        }
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const ext = file.mimetype.split('/')[1];
    const filename = `${id}_${Date.now()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    writeFileSync(filepath, file.buffer);

    const photoUrl = `/uploads/recipes/${filename}`;
    const recipe = await this.recipesService.updatePhoto(id, photoUrl, req.user.id);
    return { photoUrl: recipe.photoUrl };
  }

  @Delete(':id/photo')
  async deletePhoto(@Param('id') id: string, @Request() req: any) {
    const recipe = await this.recipesService.deletePhoto(id, req.user.id);
    return { ok: true, photoUrl: recipe.photoUrl };
  }
}
