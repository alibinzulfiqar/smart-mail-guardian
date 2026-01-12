import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma, EmailStatus } from '@smart-mail-guardian/database';
import type { NormalizedEmail } from './types';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const analysisQueue = new Queue('email-analysis', { connection });

export class EmailProcessor {
  async saveEmail(mailboxId: string, email: NormalizedEmail): Promise<any> {
    // Check if email already exists
    const existing = await prisma.email.findUnique({
      where: {
        mailboxId_externalId: {
          mailboxId,
          externalId: email.externalId,
        },
      },
    });

    if (existing) {
      console.log(`📧 Email ${email.externalId} already exists, skipping`);
      return existing;
    }

    // Save the email
    const savedEmail = await prisma.email.create({
      data: {
        mailboxId,
        externalId: email.externalId,
        threadId: email.threadId,
        from: email.from,
        fromName: email.fromName,
        to: email.to,
        cc: email.cc || [],
        bcc: email.bcc || [],
        subject: email.subject,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
        snippet: email.snippet,
        receivedAt: email.receivedAt,
        isRead: email.isRead,
        hasAttachments: email.hasAttachments,
        headers: email.headers || {},
        labels: email.labels || [],
        status: EmailStatus.PENDING,
      },
    });

    // Save attachments
    if (email.attachments && email.attachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: email.attachments.map((att) => ({
          emailId: savedEmail.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          contentId: att.contentId,
        })),
      });
    }

    // Queue for analysis
    await this.queueForAnalysis(savedEmail.id);

    return savedEmail;
  }

  async queueForAnalysis(emailId: string) {
    await analysisQueue.add(
      'analyze',
      { emailId },
      {
        priority: 5,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }
    );
    console.log(`📤 Queued email ${emailId} for analysis`);
  }
}
