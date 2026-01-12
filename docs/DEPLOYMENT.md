# Deployment Guide

## Prerequisites

- Docker & Docker Compose v2.20+
- Domain name (for production)
- SSL certificate (Let's Encrypt recommended)
- OAuth credentials for email providers

## Quick Start (Development)

```bash
# Clone repository
git clone https://github.com/yourusername/smart-mail-guardian.git
cd smart-mail-guardian

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access:
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Production Deployment

### 1. Server Requirements

- **Minimum**: 2 vCPU, 4GB RAM, 40GB SSD
- **Recommended**: 4 vCPU, 8GB RAM, 100GB SSD
- OS: Ubuntu 22.04 LTS or similar

### 2. Environment Setup

```bash
# Create deployment directory
mkdir -p /opt/smart-mail-guardian
cd /opt/smart-mail-guardian

# Clone repository
git clone https://github.com/yourusername/smart-mail-guardian.git .

# Create production environment file
cat > .env << EOF
# Database
POSTGRES_USER=smg_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=smart_mail_guardian

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth (Gmail)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth (Outlook)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# App
NODE_ENV=production
EOF
```

### 3. SSL with Traefik (Recommended)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@yourdomain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - smg-network

  dashboard:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`app.yourdomain.com`)"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.entrypoints=websecure"

  api-gateway:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.api.entrypoints=websecure"
```

Deploy:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Database Migrations

```bash
# Run migrations
docker-compose exec api-gateway npx prisma migrate deploy

# Seed initial data (optional)
docker-compose exec api-gateway npx prisma db seed
```

### 5. Monitoring

#### Health Checks

```bash
# API health
curl https://api.yourdomain.com/health

# AI Engine health
curl http://localhost:8000/health
```

#### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
```

#### Metrics (Optional)

Add Prometheus and Grafana:

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 6. Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Add to crontab:
```
0 2 * * * /opt/smart-mail-guardian/backup.sh
```

### 7. Scaling

#### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  api-gateway:
    deploy:
      replicas: 3

  email-service:
    deploy:
      replicas: 2

  ai-engine:
    deploy:
      replicas: 2
```

#### Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests.

## OAuth Setup

### Gmail

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Gmail API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials
6. Add authorized redirect URI: `https://api.yourdomain.com/auth/google/callback`

### Outlook

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application
3. Add Microsoft Graph permissions: `Mail.Read`, `Mail.ReadWrite`
4. Create client secret
5. Add redirect URI: `https://api.yourdomain.com/auth/microsoft/callback`

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs <service-name>
docker-compose ps
```

**Database connection failed:**
```bash
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

**Redis connection failed:**
```bash
docker-compose exec redis redis-cli ping
```

**AI Engine not responding:**
```bash
curl http://localhost:8000/health
docker-compose logs ai-engine
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec api-gateway npx prisma migrate reset --force
```

## Security Checklist

- [ ] Strong passwords in `.env`
- [ ] HTTPS enabled
- [ ] Firewall configured (only 80, 443 open)
- [ ] Regular backups enabled
- [ ] Log rotation configured
- [ ] OAuth credentials secured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
