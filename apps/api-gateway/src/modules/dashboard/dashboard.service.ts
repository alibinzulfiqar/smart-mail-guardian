import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RiskLevel } from '@smart-mail-guardian/database';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [
      totalEmails,
      safeEmails,
      suspiciousEmails,
      dangerousEmails,
      mailboxes,
      lastSync,
    ] = await Promise.all([
      this.prisma.email.count({
        where: { mailbox: { userId } },
      }),
      this.prisma.email.count({
        where: { mailbox: { userId }, riskLevel: RiskLevel.SAFE },
      }),
      this.prisma.email.count({
        where: { mailbox: { userId }, riskLevel: RiskLevel.SUSPICIOUS },
      }),
      this.prisma.email.count({
        where: { mailbox: { userId }, riskLevel: RiskLevel.DANGEROUS },
      }),
      this.prisma.connectedMailbox.count({
        where: { userId },
      }),
      this.prisma.connectedMailbox.findFirst({
        where: { userId },
        orderBy: { lastSyncAt: 'desc' },
        select: { lastSyncAt: true },
      }),
    ]);

    return {
      totalEmailsScanned: totalEmails,
      threatsBlocked: dangerousEmails,
      safeEmails,
      suspiciousEmails,
      dangerousEmails,
      connectedMailboxes: mailboxes,
      lastSyncAt: lastSync?.lastSyncAt || null,
    };
  }

  async getTrends(userId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emails = await this.prisma.email.findMany({
      where: {
        mailbox: { userId },
        receivedAt: { gte: startDate },
      },
      select: {
        receivedAt: true,
        riskLevel: true,
      },
    });

    // Group by date
    const trends: Record<string, { safe: number; suspicious: number; dangerous: number }> = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = { safe: 0, suspicious: 0, dangerous: 0 };
    }

    emails.forEach((email) => {
      const dateStr = email.receivedAt.toISOString().split('T')[0];
      if (trends[dateStr]) {
        if (email.riskLevel === RiskLevel.SAFE) trends[dateStr].safe++;
        else if (email.riskLevel === RiskLevel.SUSPICIOUS) trends[dateStr].suspicious++;
        else if (email.riskLevel === RiskLevel.DANGEROUS) trends[dateStr].dangerous++;
      }
    });

    return Object.entries(trends)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopThreats(userId: string) {
    const analysis = await this.prisma.aIAnalysisResult.findMany({
      where: {
        email: { mailbox: { userId } },
        riskLevel: { in: [RiskLevel.SUSPICIOUS, RiskLevel.DANGEROUS] },
      },
      select: {
        reasons: true,
      },
    });

    // Count threat types
    const threatCounts: Record<string, number> = {};
    
    analysis.forEach((a) => {
      const reasons = a.reasons as any[];
      reasons?.forEach((reason: { type: string }) => {
        threatCounts[reason.type] = (threatCounts[reason.type] || 0) + 1;
      });
    });

    const total = Object.values(threatCounts).reduce((a, b) => a + b, 0);
    
    return Object.entries(threatCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getRecentEvents(userId: string, limit = 10) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
