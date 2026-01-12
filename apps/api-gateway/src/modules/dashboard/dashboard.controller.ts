import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats(@Req() req: any) {
    return this.dashboardService.getStats(req.user.userId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get threat trends over time' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look back' })
  async getTrends(@Req() req: any, @Query('days') days?: number) {
    return this.dashboardService.getTrends(req.user.userId, days);
  }

  @Get('top-threats')
  @ApiOperation({ summary: 'Get top threat types' })
  async getTopThreats(@Req() req: any) {
    return this.dashboardService.getTopThreats(req.user.userId);
  }

  @Get('recent-events')
  @ApiOperation({ summary: 'Get recent security events' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentEvents(@Req() req: any, @Query('limit') limit?: number) {
    return this.dashboardService.getRecentEvents(req.user.userId, limit);
  }
}
