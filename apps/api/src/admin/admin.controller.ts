import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IsString } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from '../users/schemas/role.schema';
import { ADMIN_PAGE_HTML } from './admin.page';

class SetRoleDto {
  @IsString()
  role: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  // Public HTML shell; the data endpoints below are admin-only.
  @Public()
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPage(): string {
    return ADMIN_PAGE_HTML;
  }

  @Get('roles')
  @Roles('admin')
  async getRoles() {
    return this.roleModel.find().sort({ key: 1 }).exec();
  }

  @Get('users')
  @Roles('admin')
  async getUsers(@Query('search') search?: string) {
    const filter: Record<string, any> = {};
    if (search?.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ email: rx }, { username: rx }];
    }
    const users = await this.userModel
      .find(filter)
      .select('email username displayName role createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return users.map((u) => ({
      id: String(u._id),
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      role: u.role || 'user',
    }));
  }

  @Post('users/:id/role')
  @Roles('admin')
  async setUserRole(@Param('id') id: string, @Body(ValidationPipe) dto: SetRoleDto) {
    const role = await this.roleModel.findOne({ key: dto.role }).exec();
    if (!role) throw new BadRequestException(`Unknown role "${dto.role}"`);

    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    user.role = dto.role;
    await user.save();
    return { ok: true, id, role: dto.role };
  }
}
