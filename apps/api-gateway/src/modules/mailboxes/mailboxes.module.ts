import { Module } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import { MailboxesController } from './mailboxes.controller';

@Module({
  controllers: [MailboxesController],
  providers: [MailboxesService],
  exports: [MailboxesService],
})
export class MailboxesModule {}
