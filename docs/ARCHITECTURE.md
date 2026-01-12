# Architecture Overview

## System Design

Smart Mail Guardian follows a microservices architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Next.js Dashboard (Port 3000)                     │    │
│  │   • Landing Page    • Auth Pages    • Dashboard    • Settings       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  NestJS API Gateway (Port 3001)                      │    │
│  │   • REST API     • WebSocket     • Auth     • Rate Limiting         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                    │
                          ▼                    ▼
┌────────────────────────────────┐  ┌────────────────────────────────────────┐
│      PROCESSING LAYER          │  │           AI LAYER                      │
│  ┌──────────────────────────┐  │  │  ┌────────────────────────────────────┐ │
│  │   Email Service          │  │  │  │      Python AI Engine (8000)       │ │
│  │   • Gmail Provider       │  │  │  │   • Phishing Detection             │ │
│  │   • Outlook Provider     │──┼──┼──│   • Spam Detection                 │ │
│  │   • IMAP Provider        │  │  │  │   • Social Engineering             │ │
│  │   • BullMQ Workers       │  │  │  │   • URL Scanning                   │ │
│  └──────────────────────────┘  │  │  └────────────────────────────────────┘ │
└────────────────────────────────┘  └────────────────────────────────────────┘
                          │                    │
                          ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│  ┌─────────────────────┐        ┌─────────────────────────────────────┐     │
│  │   PostgreSQL        │        │           Redis                      │     │
│  │   • Users           │        │   • Session Cache                   │     │
│  │   • Mailboxes       │        │   • Job Queues                      │     │
│  │   • Emails          │        │   • Rate Limiting                   │     │
│  │   • Analysis        │        │   • Reputation Cache                │     │
│  └─────────────────────┘        └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Email Processing Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Connect    │    │    Fetch     │    │   Analyze    │    │    Apply     │
│   Mailbox    │───▶│   Emails     │───▶│   Threats    │───▶│   Actions    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  OAuth Flow         Gmail API          AI Engine          Label/Move
  Token Store        Outlook API        URL Scanner        Quarantine
  Encryption         IMAP Client        Reputation DB      Notifications
```

## Security Layers

1. **Authentication Layer**
   - JWT tokens with short expiry
   - Refresh token rotation
   - OAuth2 for email providers

2. **Authorization Layer**
   - Role-based access control
   - Resource-level permissions
   - API rate limiting

3. **Data Protection**
   - Encrypted token storage
   - No long-term email content storage
   - HTTPS enforcement

4. **Threat Detection**
   - Multi-layer analysis
   - Real-time URL scanning
   - Reputation databases

## Queue Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Redis + BullMQ                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  email-sync     │  │ email-analysis  │  │    url-scan     │  │
│  │                 │  │                 │  │                 │  │
│  │ • Fetch emails  │  │ • AI analysis   │  │ • URL expansion │  │
│  │ • Store meta    │  │ • Risk scoring  │  │ • SSL check     │  │
│  │ • Queue analyze │  │ • Create events │  │ • Brand detect  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│          │                    │                    │             │
│          └────────────────────┴────────────────────┘             │
│                              │                                   │
│                              ▼                                   │
│                     ┌─────────────────┐                          │
│                     │ Retry / Dead    │                          │
│                     │ Letter Queue    │                          │
│                     └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Overview

```
┌──────────────────┐     ┌───────────────────────┐
│      User        │     │   ConnectedMailbox    │
├──────────────────┤     ├───────────────────────┤
│ id               │────▶│ userId                │
│ email            │     │ provider (GMAIL...)   │
│ password         │     │ accessToken (enc)     │
│ role             │     │ refreshToken (enc)    │
└──────────────────┘     │ lastSyncAt            │
                         └───────────────────────┘
                                    │
                                    ▼
                         ┌───────────────────────┐
                         │        Email          │
                         ├───────────────────────┤
                         │ mailboxId             │
                         │ from, subject, body   │
                         │ riskScore             │
                         │ status                │
                         └───────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌───────────────────────┐     ┌───────────────────────┐
         │   AIAnalysisResult    │     │   EmailAttachment     │
         ├───────────────────────┤     ├───────────────────────┤
         │ phishingScore         │     │ filename              │
         │ spamScore             │     │ mimeType              │
         │ malwareScore          │     │ size                  │
         │ threatLevel           │     └───────────────────────┘
         │ explanation           │
         └───────────────────────┘
```

## Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js 14 | App Router, RSC, great DX |
| API | NestJS | Enterprise patterns, TypeScript |
| Queue | BullMQ | Reliable, Redis-based |
| Database | PostgreSQL | ACID, JSON support |
| AI | FastAPI | Fast, async, ML ecosystem |
| Styling | Tailwind CSS | Utility-first, rapid dev |
| Auth | JWT + Passport | Industry standard |
