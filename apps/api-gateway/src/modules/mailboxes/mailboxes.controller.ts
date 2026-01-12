import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MailboxesService } from './mailboxes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConnectMailboxDto } from './dto/connect-mailbox.dto';

@ApiTags('mailboxes')
@Controller('mailboxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MailboxesController {
  constructor(private readonly mailboxesService: MailboxesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all connected mailboxes' })
  async findAll(@Req() req: any) {
    return this.mailboxesService.findAllByUser(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get mailbox statistics' })
  async getStats(@Req() req: any) {
    return this.mailboxesService.getStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific mailbox' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.mailboxesService.findById(id, req.user.userId);
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect a new mailbox' })
  async connect(@Body() dto: ConnectMailboxDto, @Req() req: any) {
    return this.mailboxesService.connect(req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect a mailbox' })
  async disconnect(@Param('id') id: string, @Req() req: any) {
    return this.mailboxesService.disconnect(id, req.user.userId);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Trigger mailbox sync' })
  async sync(@Param('id') id: string, @Req() req: any) {
    return this.mailboxesService.syncMailbox(id, req.user.userId);
  }
}
