import { Body, Controller, Get, Patch, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  async updateProfile(@Body(ValidationPipe) updateProfileDto: UpdateProfileDto, @Request() req: any) {
    return this.profileService.updateProfile(req.user.id, updateProfileDto);
  }
}
