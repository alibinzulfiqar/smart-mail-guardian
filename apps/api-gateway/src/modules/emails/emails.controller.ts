import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('emails')
@Controller('emails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all emails with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'mailboxId', required: false })
  @ApiQuery({ name: 'riskLevel', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('mailboxId') mailboxId?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.emailsService.findAll(req.user.userId, {
      page,
      limit,
      mailboxId,
      riskLevel,
      status,
      search,
    });
  }

  @Get('threats')
  @ApiOperation({ summary: 'Get recent threats' })
  @ApiQuery({ name: 'limit', required: false })
  async getThreats(@Req() req: any, @Query('limit') limit?: number) {
    return this.emailsService.getThreats(req.user.userId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email by ID with analysis' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.emailsService.findById(id, req.user.userId);
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get email analysis details' })
  async getAnalysis(@Param('id') id: string, @Req() req: any) {
    const email = await this.emailsService.findById(id, req.user.userId);
    return email.analysis;
  }

  @Post(':id/quarantine')
  @ApiOperation({ summary: 'Quarantine an email' })
  async quarantine(@Param('id') id: string, @Req() req: any) {
    return this.emailsService.quarantine(id, req.user.userId);
  }

  @Post(':id/whitelist')
  @ApiOperation({ summary: 'Whitelist an email' })
  async whitelist(@Param('id') id: string, @Req() req: any) {
    return this.emailsService.whitelist(id, req.user.userId);
  }
}
