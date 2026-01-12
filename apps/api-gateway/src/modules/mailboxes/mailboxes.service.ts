import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailProvider } from '@smart-mail-guardian/database';
import { ConnectMailboxDto } from './dto/connect-mailbox.dto';

@Injectable()
export class MailboxesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.connectedMailbox.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const mailbox = await this.prisma.connectedMailbox.findFirst({
      where: { id, userId },
    });
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found');
    }
    return mailbox;
  }

  async connect(userId: string, dto: ConnectMailboxDto) {
    // TODO: Implement OAuth flow for Gmail/Outlook
    // For now, create a mock mailbox
    return this.prisma.connectedMailbox.create({
      data: {
        userId,
        provider: dto.provider as EmailProvider,
        email: dto.email,
        displayName: dto.displayName,
        accessToken: 'mock_access_token', // Encrypt in production
        refreshToken: dto.refreshToken,
        isActive: true,
      },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async disconnect(id: string, userId: string) {
    const mailbox = await this.findById(id, userId);
    await this.prisma.connectedMailbox.delete({
      where: { id: mailbox.id },
    });
    return { message: 'Mailbox disconnected successfully' };
  }

  async syncMailbox(id: string, userId: string) {
    const mailbox = await this.findById(id, userId);
    
    // TODO: Trigger email sync job
    await this.prisma.connectedMailbox.update({
      where: { id: mailbox.id },
      data: { lastSyncAt: new Date() },
    });

    return { message: 'Sync initiated', mailboxId: id };
  }

  async getStats(userId: string) {
    const mailboxes = await this.prisma.connectedMailbox.findMany({
      where: { userId },
      include: {
        _count: {
          select: { emails: true },
        },
      },
    });

    return mailboxes.map((mb) => ({
      id: mb.id,
      email: mb.email,
      provider: mb.provider,
      emailCount: mb._count.emails,
      lastSyncAt: mb.lastSyncAt,
    }));
  }
}
