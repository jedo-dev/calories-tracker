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
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { QueryBoardDto } from './dto/query-board.dto';
import { QueryUserRecipesDto } from './dto/query-user-recipes.dto';
import { CreateEntryFromRecipeDto } from './dto/create-entry-from-recipe.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const imageFileInterceptor = (field: string) =>
  FileInterceptor(field, {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only JPEG, PNG, WebP images are allowed'), false);
      }
    },
  });

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(
    private recipesService: RecipesService,
    private storage: StorageService,
  ) {}

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

  // Inline images inserted into the description by the rich-text editor.
  // Orphaned objects (image uploaded, recipe never saved) are accepted for now:
  // keys are prefixed with userId, so a future cleanup job can reconcile them
  // against img srcs in recipe descriptions.
  @Post('uploads')
  @UseInterceptors(imageFileInterceptor('image'))
  async uploadInlineImage(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const ext = file.mimetype.split('/')[1];
    const key = `inline/${req.user.id}/${randomUUID()}.${ext}`;
    const url = await this.storage.uploadObject(key, file.buffer, file.mimetype);
    return { url };
  }

  @Post(':id/photo')
  @UseInterceptors(imageFileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const existing = await this.recipesService.findById(id, req.user.id);
    const oldUrl = existing.photoUrl;

    const ext = file.mimetype.split('/')[1];
    const key = `covers/${req.user.id}/${id}_${Date.now()}.${ext}`;
    const photoUrl = await this.storage.uploadObject(key, file.buffer, file.mimetype);

    const recipe = await this.recipesService.updatePhoto(id, photoUrl, req.user.id);
    await this.storage.deleteObjectByUrl(oldUrl);
    return { photoUrl: recipe.photoUrl };
  }

  @Delete(':id/photo')
  async deletePhoto(@Param('id') id: string, @Request() req: any) {
    const existing = await this.recipesService.findById(id, req.user.id);
    await this.storage.deleteObjectByUrl(existing.photoUrl);
    const recipe = await this.recipesService.deletePhoto(id, req.user.id);
    return { ok: true, photoUrl: recipe.photoUrl };
  }
}
