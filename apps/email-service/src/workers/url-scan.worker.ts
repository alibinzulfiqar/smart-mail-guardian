import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { prisma, ThreatLevel } from '@smart-mail-guardian/database';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

interface URLScanResult {
  url: string;
  is_malicious: boolean;
  threat_types: string[];
  domain_age_days: number;
  ssl_valid: boolean;
  redirect_chain: string[];
  final_url: string;
  page_title: string;
  is_login_page: boolean;
  brand_impersonation: string | null;
  risk_score: number;
  reputation_score: number;
}

// URL Scan Worker
const urlScanWorker = new Worker(
  'url-scan',
  async (job) => {
    const { emailId, url } = job.data;
    console.log(`🔗 Scanning URL: ${url}`);

    try {
      const result = await scanUrl(url);
      
      // Update analysis result with URL findings
      const analysis = await prisma.aIAnalysisResult.findFirst({
        where: { emailId },
        orderBy: { createdAt: 'desc' },
      });

      if (analysis && result.is_malicious) {
        // Add URL threat to indicators
        const indicators = analysis.indicators as any || {};
        const maliciousUrls = indicators.maliciousUrls || [];
        maliciousUrls.push({
          url: result.url,
          threat_types: result.threat_types,
          brand_impersonation: result.brand_impersonation,
          risk_score: result.risk_score,
        });

        await prisma.aIAnalysisResult.update({
          where: { id: analysis.id },
          data: {
            indicators: {
              ...indicators,
              maliciousUrls,
            },
            // Increase threat level if malicious URL found
            threatLevel: result.risk_score > 80 
              ? ThreatLevel.CRITICAL 
              : ThreatLevel.HIGH,
          },
        });

        // Update email risk score
        const email = await prisma.email.findUnique({ where: { id: emailId } });
        if (email) {
          const newRiskScore = Math.min((email.riskScore || 0) + result.risk_score * 0.3, 100);
          await prisma.email.update({
            where: { id: emailId },
            data: { riskScore: Math.round(newRiskScore) },
          });
        }

        console.log(`⚠️ Malicious URL detected: ${url}`);
      }

      // Cache the URL reputation
      await prisma.urlReputationCache.upsert({
        where: { url: result.final_url },
        create: {
          url: result.final_url,
          isMalicious: result.is_malicious,
          threatTypes: result.threat_types,
          reputationScore: result.reputation_score,
          domainAgeDays: result.domain_age_days,
          sslValid: result.ssl_valid,
          lastChecked: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        update: {
          isMalicious: result.is_malicious,
          threatTypes: result.threat_types,
          reputationScore: result.reputation_score,
          lastChecked: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return result;

    } catch (error: any) {
      console.error(`❌ URL scan failed for ${url}:`, error.message);
      throw error;
    }
  },
  { connection, concurrency: 10 }
);

async function scanUrl(url: string): Promise<URLScanResult> {
  try {
    // Check cache first
    const cached = await prisma.urlReputationCache.findUnique({
      where: { url },
    });

    if (cached && cached.expiresAt > new Date()) {
      console.log(`📦 Using cached result for ${url}`);
      return {
        url,
        is_malicious: cached.isMalicious,
        threat_types: cached.threatTypes,
        domain_age_days: cached.domainAgeDays || 0,
        ssl_valid: cached.sslValid,
        redirect_chain: [],
        final_url: url,
        page_title: '',
        is_login_page: false,
        brand_impersonation: null,
        risk_score: cached.isMalicious ? 90 : 10,
        reputation_score: cached.reputationScore,
      };
    }

    // Call AI engine for URL analysis
    const response = await axios.post(`${AI_ENGINE_URL}/scan-url`, { url }, {
      timeout: 30000,
    });

    return response.data;

  } catch (error: any) {
    console.error('URL scan error:', error.message);
    
    // Fallback to basic checks
    return fallbackUrlScan(url);
  }
}

async function fallbackUrlScan(url: string): Promise<URLScanResult> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  
  // Basic suspicious domain patterns
  const suspiciousPatterns = [
    /^[\d-]+\./, // Starts with numbers
    /\.(tk|ml|ga|cf|gq)$/i, // Free TLDs often used for phishing
    /(paypal|amazon|apple|google|microsoft|facebook).*\.(com|net|org)/i, // Brand typosquatting
  ];
  
  const isSuspicious = suspiciousPatterns.some(p => p.test(domain));
  const isHttps = url.startsWith('https://');

  return {
    url,
    is_malicious: isSuspicious,
    threat_types: isSuspicious ? ['suspicious_domain'] : [],
    domain_age_days: -1, // Unknown
    ssl_valid: isHttps,
    redirect_chain: [],
    final_url: url,
    page_title: '',
    is_login_page: false,
    brand_impersonation: null,
    risk_score: isSuspicious ? 60 : isHttps ? 10 : 30,
    reputation_score: isSuspicious ? 20 : 50,
  };
}

urlScanWorker.on('completed', (job, result) => {
  console.log(`✅ URL scan ${job.id} completed: ${result.is_malicious ? 'MALICIOUS' : 'SAFE'}`);
});

urlScanWorker.on('failed', (job, err) => {
  console.error(`❌ URL scan job ${job?.id} failed:`, err.message);
});

console.log('🔗 URL Scan Worker started');
console.log('🔍 Listening for URL scan jobs...');
