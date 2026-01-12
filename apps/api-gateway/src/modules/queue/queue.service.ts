import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private connection: IORedis;
  private emailSyncQueue: Queue;
  private emailAnalysisQueue: Queue;
  private urlScanQueue: Queue;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.connection = new IORedis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    });

    this.emailSyncQueue = new Queue('email-sync', { connection: this.connection });
    this.emailAnalysisQueue = new Queue('email-analysis', { connection: this.connection });
    this.urlScanQueue = new Queue('url-scan', { connection: this.connection });
  }

  async onModuleDestroy() {
    await Promise.all([
      this.emailSyncQueue?.close(),
      this.emailAnalysisQueue?.close(),
      this.urlScanQueue?.close(),
    ]);
    this.connection?.disconnect();
  }

  async addEmailSyncJob(mailboxId: string, fullSync = false) {
    return this.emailSyncQueue.add(
      'sync',
      { mailboxId, fullSync },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  async addEmailAnalysisJob(emailId: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    const priorities = { low: 10, normal: 5, high: 1 };
    return this.emailAnalysisQueue.add(
      'analyze',
      { emailId },
      {
        priority: priorities[priority],
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  async addUrlScanJob(emailId: string, urls: string[]) {
    return this.urlScanQueue.add(
      'scan',
      { emailId, urls },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
      },
    );
  }

  async getQueueStats() {
    const [syncCounts, analysisCounts, urlCounts] = await Promise.all([
      this.emailSyncQueue.getJobCounts(),
      this.emailAnalysisQueue.getJobCounts(),
      this.urlScanQueue.getJobCounts(),
    ]);

    return {
      emailSync: syncCounts,
      emailAnalysis: analysisCounts,
      urlScan: urlCounts,
    };
  }
}
