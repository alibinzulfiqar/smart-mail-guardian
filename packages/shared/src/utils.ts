// ============================================
// SmartMailGuardian - Shared Utilities
// ============================================

import { RISK_THRESHOLDS } from './constants';
import type { RiskLevel, ThreatReason } from './types';

/**
 * Calculate risk level based on risk score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.SAFE_MAX) return 'safe';
  if (score <= RISK_THRESHOLDS.SUSPICIOUS_MAX) return 'suspicious';
  return 'dangerous';
}

/**
 * Calculate overall risk score from individual scores
 */
export function calculateRiskScore(scores: {
  phishing: number;
  malware: number;
  socialEngineering: number;
  spam: number;
}): number {
  const weights = {
    phishing: 0.35,
    malware: 0.35,
    socialEngineering: 0.20,
    spam: 0.10,
  };

  const weightedScore =
    scores.phishing * weights.phishing +
    scores.malware * weights.malware +
    scores.socialEngineering * weights.socialEngineering +
    scores.spam * weights.spam;

  return Math.round(Math.min(100, Math.max(0, weightedScore)));
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: ThreatReason['severity']): string {
  const colors = {
    low: '#22c55e',      // green
    medium: '#eab308',   // yellow
    high: '#f97316',     // orange
    critical: '#ef4444', // red
  };
  return colors[severity];
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors = {
    safe: '#22c55e',       // green
    suspicious: '#f97316', // orange
    dangerous: '#ef4444',  // red
  };
  return colors[level];
}

/**
 * Format date to relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract domain from URL
 */
export function extractUrlDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Check if URL is suspicious
 */
export function isSuspiciousUrl(url: string): boolean {
  const suspicious = [
    /bit\.ly/i,
    /tinyurl\.com/i,
    /goo\.gl/i,
    /t\.co/i,
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    /login.*\./i,
    /signin.*\./i,
    /verify.*\./i,
    /secure.*\./i,
    /update.*\./i,
    /account.*\./i,
  ];

  return suspicious.some((pattern) => pattern.test(url));
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

/**
 * Generate random ID
 */
export function generateId(prefix?: string): string {
  const id = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 1000, maxDelayMs = 30000 } = options;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Mask email for privacy
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const maskedLocal = local.length > 2
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : local;
  
  return `${maskedLocal}@${domain}`;
}
