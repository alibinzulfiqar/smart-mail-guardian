# Contributing to Smart Mail Guardian

First off, thank you for considering contributing to Smart Mail Guardian! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node.js version, Python version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the expected behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-mail-guardian.git
cd smart-mail-guardian

# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d postgres redis

# Setup environment
cp .env.example .env

# Setup database
pnpm db:push
pnpm db:seed

# Start development servers
pnpm dev
```

### Project Structure

```
smart-mail-guardian/
├── apps/
│   ├── dashboard/        # Next.js 14 frontend
│   ├── api-gateway/      # NestJS backend API
│   └── email-service/    # Email processing service
├── packages/
│   ├── shared/           # Shared TypeScript types/utils
│   ├── database/         # Prisma schema and client
│   └── ai-engine/        # Python AI analysis engine
└── docs/                 # Documentation
```

### Coding Standards

#### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Use `async/await` over Promises where possible

#### Python

- Follow PEP 8 style guide
- Use type hints
- Document functions with docstrings
- Use `async/await` for I/O operations

#### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
feat: add email quarantine functionality

- Add quarantine endpoint to API
- Create quarantine folder in email providers
- Add quarantine status to email model

Closes #123
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @smart-mail-guardian/api-gateway test

# Run Python tests
cd packages/ai-engine
pytest
```

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md with notes on your changes
3. The PR will be merged once you have the sign-off of at least one maintainer

## Architecture Guidelines

### Adding New Features

1. **Start with the types**: Define TypeScript interfaces in `packages/shared`
2. **Update the schema**: If needed, update `packages/database/prisma/schema.prisma`
3. **Implement the API**: Add endpoints in `apps/api-gateway`
4. **Add AI analysis**: If needed, extend `packages/ai-engine`
5. **Build the UI**: Create components in `apps/dashboard`

### Security Considerations

- Never log sensitive data (tokens, passwords, email content)
- Use parameterized queries (Prisma handles this)
- Validate all user inputs
- Encrypt tokens before storing
- Use HTTPS in production

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
