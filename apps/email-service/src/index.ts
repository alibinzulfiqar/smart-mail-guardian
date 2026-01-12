import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { GmailProvider } from './providers/gmail';
import { OutlookProvider } from './providers/outlook';
import { ImapProvider } from './providers/imap';
import { EmailProcessor } from './processor';
import { prisma } from '@smart-mail-guardian/database';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const processor = new EmailProcessor();

// Email Sync Worker
const syncWorker = new Worker(
  'email-sync',
  async (job) => {
    const { mailboxId, fullSync } = job.data;
    console.log(`📧 Processing sync job for mailbox: ${mailboxId}`);

    const mailbox = await prisma.connectedMailbox.findUnique({
      where: { id: mailboxId },
    });

    if (!mailbox) {
      throw new Error(`Mailbox ${mailboxId} not found`);
    }

    let provider;
    switch (mailbox.provider) {
      case 'GMAIL':
        provider = new GmailProvider(mailbox);
        break;
      case 'OUTLOOK':
        provider = new OutlookProvider(mailbox);
        break;
      case 'IMAP':
      case 'YAHOO':
        provider = new ImapProvider(mailbox);
        break;
      default:
        throw new Error(`Unsupported provider: ${mailbox.provider}`);
    }

    const emails = await provider.fetchEmails(fullSync);
    console.log(`📬 Fetched ${emails.length} emails from ${mailbox.provider}`);

    for (const email of emails) {
      await processor.saveEmail(mailboxId, email);
    }

    await prisma.connectedMailbox.update({
      where: { id: mailboxId },
      data: { lastSyncAt: new Date() },
    });

    return { processed: emails.length };
  },
  { connection }
);

syncWorker.on('completed', (job, result) => {
  console.log(`✅ Sync job ${job.id} completed: ${result.processed} emails`);
});

syncWorker.on('failed', (job, err) => {
  console.error(`❌ Sync job ${job?.id} failed:`, err.message);
});

console.log('🚀 Email Service started');
console.log('📬 Listening for email sync jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await syncWorker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});
