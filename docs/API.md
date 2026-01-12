# API Reference

## Base URL

```
Development: http://localhost:3001
Production: https://api.your-domain.com
```

## Authentication

All API requests (except auth endpoints) require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Register

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

---

## User Endpoints

### Get Profile

```http
GET /users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update Profile

```http
PATCH /users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

---

## Mailbox Endpoints

### List Mailboxes

```http
GET /mailboxes
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "provider": "GMAIL",
    "email": "user@gmail.com",
    "isActive": true,
    "lastSyncAt": "2024-01-01T12:00:00Z",
    "emailCount": 1250,
    "threatCount": 15
  }
]
```

### Connect Mailbox

```http
POST /mailboxes/connect
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "provider": "GMAIL",
  "accessToken": "oauth_token",
  "refreshToken": "refresh_token",
  "email": "user@gmail.com"
}
```

### Disconnect Mailbox

```http
DELETE /mailboxes/:id
Authorization: Bearer <token>
```

### Sync Mailbox

```http
POST /mailboxes/:id/sync
Authorization: Bearer <token>
```

**Query Parameters:**
- `fullSync` (boolean): Perform full sync instead of incremental

---

## Email Endpoints

### List Emails

```http
GET /emails
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (PENDING, SAFE, SUSPICIOUS, QUARANTINED)
- `mailboxId` (string): Filter by mailbox
- `minRiskScore` (number): Minimum risk score (0-100)
- `search` (string): Search in subject/sender

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "from": "sender@example.com",
      "fromName": "Sender Name",
      "subject": "Email Subject",
      "snippet": "Preview text...",
      "receivedAt": "2024-01-01T12:00:00Z",
      "riskScore": 75,
      "status": "SUSPICIOUS",
      "hasAttachments": true
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Get Email Details

```http
GET /emails/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "from": "sender@example.com",
  "fromName": "Sender Name",
  "to": ["recipient@example.com"],
  "subject": "Email Subject",
  "bodyText": "Plain text content...",
  "bodyHtml": "<html>...",
  "receivedAt": "2024-01-01T12:00:00Z",
  "riskScore": 75,
  "status": "SUSPICIOUS",
  "attachments": [...],
  "analysis": {
    "phishingScore": 0.8,
    "spamScore": 0.2,
    "malwareScore": 0.1,
    "threatLevel": "HIGH",
    "explanation": "..."
  }
}
```

### Quarantine Email

```http
POST /emails/:id/quarantine
Authorization: Bearer <token>
```

### Whitelist Sender

```http
POST /emails/:id/whitelist
Authorization: Bearer <token>
```

### Get Threats

```http
GET /emails/threats
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (number): Number of days to look back (default: 7)
- `minRiskScore` (number): Minimum risk score (default: 50)

---

## Dashboard Endpoints

### Get Stats

```http
GET /dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalEmails": 5000,
  "threatsBlocked": 125,
  "emailsScanned": 4875,
  "securityScore": 92,
  "threatsByLevel": {
    "CRITICAL": 5,
    "HIGH": 20,
    "MEDIUM": 45,
    "LOW": 55
  },
  "threatsByType": {
    "phishing": 45,
    "spam": 35,
    "malware": 10,
    "social_engineering": 35
  }
}
```

### Get Trends

```http
GET /dashboard/trends
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (number): Number of days (default: 7)

**Response:**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "emailsScanned": 150,
      "threatsDetected": 12
    }
  ]
}
```

### Get Top Threats

```http
GET /dashboard/top-threats
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number): Number of results (default: 10)

### Get Recent Events

```http
GET /dashboard/recent-events
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number): Number of results (default: 20)

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Default**: 100 requests per minute
- **Auth endpoints**: 10 requests per minute
- **Sync endpoints**: 5 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## WebSocket Events

Connect to: `ws://localhost:3001`

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `threat:detected` | Server → Client | New threat detected |
| `email:analyzed` | Server → Client | Email analysis complete |
| `sync:progress` | Server → Client | Sync progress update |
| `sync:complete` | Server → Client | Sync completed |

### Example

```javascript
const socket = io('ws://localhost:3001', {
  auth: { token: 'your_jwt_token' }
});

socket.on('threat:detected', (data) => {
  console.log('New threat:', data);
});
```
