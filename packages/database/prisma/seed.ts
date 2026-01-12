// ============================================
// SmartMailGuardian - Database Seed Script
// ============================================

import { PrismaClient, UserRole, EmailProvider, RiskLevel, EmailStatus, SecurityEventType, EventSeverity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create demo user (password: 'password123' - hashed with bcrypt)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@smartmailguardian.com' },
    update: {},
    create: {
      email: 'demo@smartmailguardian.com',
      passwordHash: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // password123
      name: 'Demo User',
      isEmailVerified: true,
      isActive: true,
      role: UserRole.USER,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartmailguardian.com' },
    update: {},
    create: {
      email: 'admin@smartmailguardian.com',
      passwordHash: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // password123
      name: 'Admin User',
      isEmailVerified: true,
      isActive: true,
      role: UserRole.ADMIN,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create a mock connected mailbox for demo
  const mockMailbox = await prisma.connectedMailbox.upsert({
    where: {
      userId_email: {
        userId: demoUser.id,
        email: 'demo.inbox@gmail.com',
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      provider: EmailProvider.GMAIL,
      email: 'demo.inbox@gmail.com',
      displayName: 'Demo Gmail Inbox',
      accessToken: 'mock_access_token_for_demo',
      refreshToken: 'mock_refresh_token_for_demo',
      isActive: true,
      lastSyncAt: new Date(),
    },
  });

  console.log(`✅ Created mock mailbox: ${mockMailbox.email}`);

  // Create sample emails with various risk levels
  const sampleEmails = [
    {
      externalId: 'sample_1',
      from: 'newsletter@company.com',
      fromName: 'Company Newsletter',
      to: ['demo.inbox@gmail.com'],
      subject: 'Weekly Newsletter - March 2024',
      bodyText: 'Here is your weekly newsletter with the latest updates...',
      receivedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      riskScore: 5,
      riskLevel: RiskLevel.SAFE,
      status: EmailStatus.ANALYZED,
    },
    {
      externalId: 'sample_2',
      from: 'support@bankk-secure.com',
      fromName: 'Bank Security',
      to: ['demo.inbox@gmail.com'],
      subject: 'URGENT: Verify your account immediately',
      bodyText: 'Your account will be suspended unless you verify your identity within 24 hours. Click here: http://bankk-secure.malicious.com/verify',
      receivedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      riskScore: 95,
      riskLevel: RiskLevel.DANGEROUS,
      status: EmailStatus.QUARANTINED,
    },
    {
      externalId: 'sample_3',
      from: 'invoice@supplier-invoices.net',
      fromName: 'Invoice Department',
      to: ['demo.inbox@gmail.com'],
      subject: 'Invoice #INV-2024-0892 - Payment Required',
      bodyText: 'Please find attached your invoice for immediate payment. Download the invoice PDF here.',
      receivedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      riskScore: 65,
      riskLevel: RiskLevel.SUSPICIOUS,
      status: EmailStatus.ANALYZED,
      hasAttachments: true,
    },
    {
      externalId: 'sample_4',
      from: 'john.doe@gmail.com',
      fromName: 'John Doe',
      to: ['demo.inbox@gmail.com'],
      subject: 'Meeting tomorrow at 3pm',
      bodyText: 'Hi, just confirming our meeting tomorrow at 3pm. Looking forward to it!',
      receivedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      riskScore: 2,
      riskLevel: RiskLevel.SAFE,
      status: EmailStatus.ANALYZED,
    },
    {
      externalId: 'sample_5',
      from: 'ceo@company-executives.org',
      fromName: 'CEO Office',
      to: ['demo.inbox@gmail.com'],
      subject: 'Confidential: Wire Transfer Request',
      bodyText: 'I need you to process an urgent wire transfer. This is confidential and time-sensitive. Reply immediately with your availability.',
      receivedAt: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
      riskScore: 88,
      riskLevel: RiskLevel.DANGEROUS,
      status: EmailStatus.ANALYZED,
    },
  ];

  for (const emailData of sampleEmails) {
    const email = await prisma.email.upsert({
      where: {
        mailboxId_externalId: {
          mailboxId: mockMailbox.id,
          externalId: emailData.externalId,
        },
      },
      update: {},
      create: {
        mailboxId: mockMailbox.id,
        ...emailData,
        cc: [],
        bcc: [],
        isRead: false,
        hasAttachments: emailData.hasAttachments || false,
      },
    });

    // Create analysis result for analyzed emails
    if (email.status !== EmailStatus.PENDING) {
      await prisma.aIAnalysisResult.upsert({
        where: { emailId: email.id },
        update: {},
        create: {
          emailId: email.id,
          riskScore: email.riskScore || 0,
          phishingScore: email.riskLevel === RiskLevel.DANGEROUS ? 85 : email.riskLevel === RiskLevel.SUSPICIOUS ? 45 : 5,
          malwareScore: email.riskLevel === RiskLevel.DANGEROUS ? 70 : 10,
          socialEngineeringScore: email.riskLevel === RiskLevel.DANGEROUS ? 90 : 15,
          spamScore: 10,
          riskLevel: email.riskLevel || RiskLevel.SAFE,
          reasons: email.riskLevel === RiskLevel.DANGEROUS
            ? [
                { type: 'phishing', severity: 'critical', description: 'Suspicious link detected', confidence: 0.95 },
                { type: 'urgency_manipulation', severity: 'high', description: 'Urgency tactics detected', confidence: 0.88 },
              ]
            : email.riskLevel === RiskLevel.SUSPICIOUS
            ? [
                { type: 'suspicious_attachment', severity: 'medium', description: 'Potentially risky attachment', confidence: 0.72 },
              ]
            : [],
          recommendations: email.riskLevel === RiskLevel.DANGEROUS
            ? ['Do not click any links', 'Report as phishing', 'Delete immediately']
            : email.riskLevel === RiskLevel.SUSPICIOUS
            ? ['Verify sender identity', 'Scan attachments before opening']
            : ['No action required'],
          explanation: email.riskLevel === RiskLevel.DANGEROUS
            ? 'This email shows multiple signs of a phishing attack. It uses urgency tactics and contains suspicious links.'
            : email.riskLevel === RiskLevel.SUSPICIOUS
            ? 'This email has some suspicious characteristics. Exercise caution with any attachments.'
            : 'This email appears to be legitimate with no security concerns.',
          detectedPatterns: email.riskLevel === RiskLevel.DANGEROUS ? ['credential_theft', 'urgency'] : [],
          modelVersion: '1.0.0',
          processingTimeMs: Math.floor(Math.random() * 500) + 100,
        },
      });
    }

    console.log(`✅ Created sample email: ${emailData.subject.substring(0, 40)}...`);
  }

  // Create sample security events
  const securityEvents = [
    {
      userId: demoUser.id,
      eventType: SecurityEventType.THREAT_DETECTED,
      severity: EventSeverity.CRITICAL,
      title: 'Phishing Attempt Blocked',
      description: 'A dangerous phishing email was detected and quarantined.',
    },
    {
      userId: demoUser.id,
      eventType: SecurityEventType.MAILBOX_CONNECTED,
      severity: EventSeverity.INFO,
      title: 'Mailbox Connected',
      description: 'Gmail account demo.inbox@gmail.com was successfully connected.',
    },
    {
      userId: demoUser.id,
      eventType: SecurityEventType.SYNC_COMPLETED,
      severity: EventSeverity.INFO,
      title: 'Email Sync Completed',
      description: '50 emails were synced and analyzed.',
    },
  ];

  for (const event of securityEvents) {
    await prisma.securityEvent.create({
      data: event,
    });
    console.log(`✅ Created security event: ${event.title}`);
  }

  // Create sample domain reputation cache
  const domainCache = [
    { domain: 'gmail.com', trustScore: 95, isSpammer: false, spfRecord: true, dkimRecord: true, dmarcRecord: true },
    { domain: 'bankk-secure.com', trustScore: 5, isSpammer: true, spfRecord: false, dkimRecord: false, dmarcRecord: false },
    { domain: 'company.com', trustScore: 80, isSpammer: false, spfRecord: true, dkimRecord: true, dmarcRecord: true },
  ];

  for (const domain of domainCache) {
    await prisma.domainReputationCache.upsert({
      where: { domain: domain.domain },
      update: {},
      create: {
        ...domain,
        domainAge: Math.floor(Math.random() * 3650) + 30,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });
    console.log(`✅ Cached domain reputation: ${domain.domain}`);
  }

  console.log('\n✨ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
