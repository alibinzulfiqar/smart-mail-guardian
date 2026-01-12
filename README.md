# 🛡️ SmartMailGuardian

> **AI-Powered Email Security Gateway** - Protect your inbox from phishing, scams, malware & social engineering attacks.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)

---

## 🎯 What is SmartMailGuardian?

SmartMailGuardian is a **full-stack, open-source email security platform** that connects to your existing email providers (Gmail, Outlook, Yahoo, IMAP) and provides real-time threat detection using AI.

**This is NOT an email server.** It's a security brain that:
- 🔍 Intercepts & analyzes incoming emails
- 🤖 Detects phishing, scams, malware using AI/ML
- 📊 Assigns security risk scores with explanations
- 🏷️ Labels/quarantines dangerous emails in your mailbox
- 📈 Provides a beautiful dashboard for monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SmartMailGuardian                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │   Dashboard  │   │  API Gateway │   │ Email Service│   │  AI Engine   │ │
│  │  (Next.js)   │◄─►│   (NestJS)   │◄─►│  (Node.js)   │◄─►│  (FastAPI)   │ │
│  │              │   │              │   │              │   │              │ │
│  │ • Auth       │   │ • REST API   │   │ • Gmail API  │   │ • NLP        │ │
│  │ • Dashboard  │   │ • WebSocket  │   │ • Outlook    │   │ • Phishing   │ │
│  │ • Email View │   │ • BullMQ     │   │ • IMAP       │   │ • Malware    │ │
│  │ • Analytics  │   │ • Auth/JWT   │   │ • OAuth2     │   │ • Scoring    │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘ │
│           │                 │                  │                  │         │
│           └─────────────────┴──────────────────┴──────────────────┘         │
│                                      │                                      │
│                          ┌───────────┴───────────┐                          │
│                          │                       │                          │
│                    ┌─────┴─────┐          ┌──────┴──────┐                   │
│                    │PostgreSQL │          │    Redis    │                   │
│                    │           │          │   (Cache &  │                   │
│                    │ • Users   │          │    Queue)   │                   │
│                    │ • Emails  │          │             │                   │
│                    │ • Results │          │ • BullMQ    │                   │
│                    └───────────┘          └─────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
smart-mail-guardian/
├── apps/
│   ├── dashboard/          # Next.js 14 Frontend (App Router)
│   ├── api-gateway/        # NestJS Backend API
│   └── email-service/      # Email Integration Service
├── packages/
│   ├── ai-engine/          # Python FastAPI AI Service
│   ├── database/           # Prisma Schema & Migrations
│   ├── shared/             # Shared TypeScript Types
│   └── ui/                 # Shared UI Components (shadcn/ui)
├── docker/                 # Docker configurations
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── .github/                # GitHub Actions & Templates
```

---

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router, RSC)
- **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **Zustand** (State Management)
- **Framer Motion** (Animations)
- **Socket.io Client** (Real-time)

### Backend API
- **NestJS** (TypeScript)
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Redis** (Cache & Queue)
- **BullMQ** (Job Queue)
- **Socket.io** (WebSocket)
- **Passport.js** (OAuth)

### AI Engine
- **Python 3.11+**
- **FastAPI**
- **Scikit-learn**
- **Transformers** (Hugging Face)
- **spaCy** (NLP)

### Email Integration
- **Gmail API**
- **Microsoft Graph API**
- **IMAP Client**
- **OAuth2**

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-mail-guardian.git
cd smart-mail-guardian

# Install dependencies (using pnpm - recommended)
pnpm install

# Setup environment variables
cp .env.example .env

# Setup database
pnpm db:push

# Start all services (development)
pnpm dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 📋 Features

### 🎨 Dashboard
- [x] Beautiful, responsive UI
- [x] Dark/Light mode
- [x] Real-time threat stream
- [x] Email security overview
- [x] Detailed analysis view
- [x] Audit history
- [x] Settings management

### 🔐 Security Features
- [x] Phishing detection (AI)
- [x] Social engineering analysis
- [x] URL reputation check
- [x] Attachment scanning
- [x] Domain trust scoring
- [x] Urgency pattern detection
- [x] Sender reputation

### 📧 Email Providers
- [x] Gmail (OAuth2)
- [x] Outlook/Office 365
- [x] Yahoo Mail
- [x] Generic IMAP/SMTP

---

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [NestJS](https://nestjs.com/) - Node.js Framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python Framework
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Prisma](https://www.prisma.io/) - Database ORM
- [BullMQ](https://docs.bullmq.io/) - Job Queue

---

<p align="center">
  Made with ❤️ by the SmartMailGuardian Team
</p>
