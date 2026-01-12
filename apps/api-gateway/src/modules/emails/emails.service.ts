import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailStatus, RiskLevel } from '@smart-mail-guardian/database';

@Injectable()
export class EmailsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      mailboxId?: string;
      riskLevel?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, mailboxId, riskLevel, status, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      mailbox: { userId },
    };

    if (mailboxId) where.mailboxId = mailboxId;
    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [emails, total] = await Promise.all([
      this.prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: {
          mailbox: {
            select: { email: true, provider: true },
          },
          analysis: {
            select: {
              riskScore: true,
              riskLevel: true,
              reasons: true,
            },
          },
        },
      }),
      this.prisma.email.count({ where }),
    ]);

    return {
      data: emails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };
  }

  async findById(id: string, userId: string) {
    const email = await this.prisma.email.findFirst({
      where: {
        id,
        mailbox: { userId },
      },
      include: {
        mailbox: {
          select: { email: true, provider: true },
        },
        analysis: true,
        attachments: true,
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return email;
  }

  async quarantine(id: string, userId: string) {
    const email = await this.findById(id, userId);
    
    return this.prisma.email.update({
      where: { id: email.id },
      data: { status: EmailStatus.QUARANTINED },
    });
  }

  async whitelist(id: string, userId: string) {
    const email = await this.findById(id, userId);
    
    return this.prisma.email.update({
      where: { id: email.id },
      data: { status: EmailStatus.WHITELISTED },
    });
  }

  async getThreats(userId: string, limit = 10) {
    return this.prisma.email.findMany({
      where: {
        mailbox: { userId },
        riskLevel: { in: [RiskLevel.SUSPICIOUS, RiskLevel.DANGEROUS] },
      },
      take: limit,
      orderBy: { receivedAt: 'desc' },
      include: {
        analysis: {
          select: {
            riskScore: true,
            reasons: true,
            explanation: true,
          },
        },
      },
    });
  }
}
