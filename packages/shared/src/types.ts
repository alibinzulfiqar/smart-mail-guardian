// ============================================
// SmartMailGuardian - Shared Types
// ============================================

// ===================
// User Types
// ===================
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ===================
// Email Provider Types
// ===================
export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'imap';

export interface ConnectedMailbox {
  id: string;
  userId: string;
  provider: EmailProvider;
  email: string;
  displayName: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectMailboxDto {
  provider: EmailProvider;
  authCode?: string;
  // For IMAP
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  useSsl?: boolean;
}

// ===================
// Email Types
// ===================
export interface Email {
  id: string;
  mailboxId: string;
  externalId: string;
  threadId: string | null;
  from: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  headers: Record<string, string>;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  status: EmailStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId: string | null;
}

export type RiskLevel = 'safe' | 'suspicious' | 'dangerous';

export type EmailStatus = 'pending' | 'analyzing' | 'analyzed' | 'quarantined' | 'whitelisted';

// ===================
// AI Analysis Types
// ===================
export interface AIAnalysisResult {
  id: string;
  emailId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  phishingScore: number;
  malwareScore: number;
  socialEngineeringScore: number;
  spamScore: number;
  reasons: ThreatReason[];
  recommendations: string[];
  explanation: string;
  detectedPatterns: string[];
  senderReputation: SenderReputation;
  urlAnalysis: UrlAnalysis[];
  attachmentAnalysis: AttachmentAnalysis[];
  modelVersion: string;
  analyzedAt: Date;
}

export interface ThreatReason {
  type: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string | null;
  confidence: number;
}

export type ThreatType =
  | 'phishing'
  | 'credential_theft'
  | 'impersonation'
  | 'urgency_manipulation'
  | 'suspicious_link'
  | 'malware'
  | 'suspicious_attachment'
  | 'social_engineering'
  | 'ceo_fraud'
  | 'invoice_scam'
  | 'romance_scam'
  | 'crypto_scam'
  | 'spam'
  | 'spoofed_sender';

export interface SenderReputation {
  email: string;
  domain: string;
  domainAge: number | null;
  spfPass: boolean | null;
  dkimPass: boolean | null;
  dmarcPass: boolean | null;
  isKnownSpammer: boolean;
  trustScore: number;
}

export interface UrlAnalysis {
  url: string;
  expandedUrl: string | null;
  domain: string;
  isMalicious: boolean;
  isSuspicious: boolean;
  isLoginPage: boolean;
  sslValid: boolean | null;
  brandImpersonation: string | null;
  reputation: 'safe' | 'suspicious' | 'dangerous' | 'unknown';
}

export interface AttachmentAnalysis {
  filename: string;
  mimeType: string;
  size: number;
  isMalicious: boolean;
  isSuspicious: boolean;
  hasMacros: boolean | null;
  isExecutable: boolean;
  scanResult: string;
}

// ===================
// Security Event Types
// ===================
export interface SecurityEvent {
  id: string;
  userId: string;
  emailId: string | null;
  eventType: SecurityEventType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type SecurityEventType =
  | 'threat_detected'
  | 'email_quarantined'
  | 'email_whitelisted'
  | 'mailbox_connected'
  | 'mailbox_disconnected'
  | 'sync_completed'
  | 'sync_failed'
  | 'user_action';

// ===================
// Dashboard Types
// ===================
export interface DashboardStats {
  totalEmailsScanned: number;
  threatsBlocked: number;
  safeEmails: number;
  suspiciousEmails: number;
  dangerousEmails: number;
  connectedMailboxes: number;
  lastSyncAt: Date | null;
}

export interface ThreatTrend {
  date: string;
  safe: number;
  suspicious: number;
  dangerous: number;
}

export interface TopThreat {
  type: ThreatType;
  count: number;
  percentage: number;
}

// ===================
// API Response Types
// ===================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ===================
// WebSocket Events
// ===================
export type WebSocketEvent =
  | 'email:new'
  | 'email:analyzed'
  | 'email:quarantined'
  | 'threat:detected'
  | 'sync:started'
  | 'sync:completed'
  | 'sync:failed';

export interface WebSocketPayload<T = unknown> {
  event: WebSocketEvent;
  data: T;
  timestamp: Date;
}

// ===================
// Job Queue Types
// ===================
export interface EmailAnalysisJob {
  emailId: string;
  mailboxId: string;
  priority: 'low' | 'normal' | 'high';
}

export interface EmailSyncJob {
  mailboxId: string;
  fullSync: boolean;
}

export interface UrlScanJob {
  emailId: string;
  urls: string[];
}

export interface AttachmentScanJob {
  emailId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
}
