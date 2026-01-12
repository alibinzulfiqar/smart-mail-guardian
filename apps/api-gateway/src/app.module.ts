import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailboxesModule } from './modules/mailboxes/mailboxes.module';
import { EmailsModule } from './modules/emails/emails.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { QueueModule } from './modules/queue/queue.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    MailboxesModule,
    EmailsModule,
    DashboardModule,
    QueueModule,
  ],
})
export class AppModule {}
