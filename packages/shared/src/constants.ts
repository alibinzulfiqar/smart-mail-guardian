// ============================================
// SmartMailGuardian - Shared Constants
// ============================================

// ===================
// Risk Score Thresholds
// ===================
export const RISK_THRESHOLDS = {
  SAFE_MAX: 30,
  SUSPICIOUS_MAX: 70,
  DANGEROUS_MIN: 71,
} as const;

// ===================
// Email Sync Settings
// ===================
export const EMAIL_SYNC = {
  DEFAULT_BATCH_SIZE: 50,
  MAX_BATCH_SIZE: 100,
  DEFAULT_INTERVAL_MS: 60000, // 1 minute
  MIN_INTERVAL_MS: 30000, // 30 seconds
} as const;

// ===================
// AI Analysis Settings
// ===================
export const AI_ANALYSIS = {
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  MIN_CONFIDENCE_THRESHOLD: 0.5,
  MODEL_VERSION: '1.0.0',
} as const;

// ===================
// Rate Limiting
// ===================
export const RATE_LIMITS = {
  DEFAULT_TTL_MS: 60000,
  DEFAULT_MAX_REQUESTS: 100,
  AUTH_MAX_ATTEMPTS: 5,
  AUTH_LOCKOUT_MS: 900000, // 15 minutes
} as const;

// ===================
// JWT Settings
// ===================
export const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256',
} as const;

// ===================
// Email Provider Scopes
// ===================
export const OAUTH_SCOPES = {
  GMAIL: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  OUTLOOK: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'Mail.Read',
    'Mail.ReadWrite',
  ],
} as const;

// ===================
// Queue Names
// ===================
export const QUEUE_NAMES = {
  EMAIL_SYNC: 'email-sync',
  EMAIL_ANALYSIS: 'email-analysis',
  URL_SCAN: 'url-scan',
  ATTACHMENT_SCAN: 'attachment-scan',
  NOTIFICATIONS: 'notifications',
} as const;

// ===================
// WebSocket Rooms
// ===================
export const WS_ROOMS = {
  USER_PREFIX: 'user:',
  ADMIN: 'admin',
  THREATS: 'threats',
} as const;

// ===================
// API Routes
// ===================
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    GOOGLE: '/auth/google',
    MICROSOFT: '/auth/microsoft',
  },
  USERS: {
    ME: '/users/me',
    UPDATE: '/users/me',
    DELETE: '/users/me',
  },
  MAILBOXES: {
    LIST: '/mailboxes',
    CONNECT: '/mailboxes/connect',
    DISCONNECT: '/mailboxes/:id/disconnect',
    SYNC: '/mailboxes/:id/sync',
  },
  EMAILS: {
    LIST: '/emails',
    GET: '/emails/:id',
    QUARANTINE: '/emails/:id/quarantine',
    WHITELIST: '/emails/:id/whitelist',
    ANALYSIS: '/emails/:id/analysis',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    TRENDS: '/dashboard/trends',
    TOP_THREATS: '/dashboard/top-threats',
    RECENT_THREATS: '/dashboard/recent-threats',
  },
  SECURITY_EVENTS: {
    LIST: '/security-events',
    GET: '/security-events/:id',
  },
} as const;

// ===================
// Threat Severity Weights
// ===================
export const THREAT_WEIGHTS = {
  phishing: 30,
  credential_theft: 35,
  impersonation: 25,
  urgency_manipulation: 15,
  suspicious_link: 20,
  malware: 40,
  suspicious_attachment: 25,
  social_engineering: 20,
  ceo_fraud: 35,
  invoice_scam: 30,
  romance_scam: 25,
  crypto_scam: 25,
  spam: 10,
  spoofed_sender: 20,
} as const;

// ===================
// File Extensions Risk
// ===================
export const RISKY_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.pif',
  '.application',
  '.gadget',
  '.msc',
  '.jar',
  '.js',
  '.jse',
  '.ws',
  '.wsf',
  '.wsc',
  '.wsh',
  '.ps1',
  '.ps1xml',
  '.ps2',
  '.ps2xml',
  '.psc1',
  '.psc2',
  '.msh',
  '.msh1',
  '.msh2',
  '.mshxml',
  '.msh1xml',
  '.msh2xml',
  '.vb',
  '.vbe',
  '.vbs',
  '.dll',
  '.iso',
  '.img',
] as const;

// ===================
// Trusted Domains (examples)
// ===================
export const TRUSTED_DOMAINS = [
  'google.com',
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'github.com',
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'paypal.com',
] as const;
