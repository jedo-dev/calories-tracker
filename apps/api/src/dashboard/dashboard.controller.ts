import { Controller, Get, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('day')
  async getDayDashboard(@Query(ValidationPipe) query: QueryDashboardDto, @Request() req: any) {
    return this.dashboardService.getDayDashboard(req.user.id, query.date);
  }
}
