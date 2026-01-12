import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { prisma, RiskLevel } from '@smart-mail-guardian/database';

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
  is_suspicious: boolean;
  threat_types: string[];
  domain: string;
  domain_age_days: number;
  ssl_valid: boolean;
  redirect_chain: string[];
  final_url: string;
  page_title: string;
  is_login_page: boolean;
  brand_impersonation: string | null;
  risk_score: number;
  reputation: string;
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
      const analysis = await prisma.aIAnalysisResult.findUnique({
        where: { emailId },
      });

      if (analysis && result.is_malicious) {
        // Get current URL analysis
        const currentUrlAnalysis = (analysis.urlAnalysis as any) || {};
        const maliciousUrls = currentUrlAnalysis.maliciousUrls || [];
        maliciousUrls.push({
          url: result.url,
          threat_types: result.threat_types,
          brand_impersonation: result.brand_impersonation,
          risk_score: result.risk_score,
        });

        await prisma.aIAnalysisResult.update({
          where: { id: analysis.id },
          data: {
            urlAnalysis: {
              ...currentUrlAnalysis,
              maliciousUrls,
            },
            // Increase risk level if malicious URL found
            riskLevel: result.risk_score > 80 
              ? RiskLevel.DANGEROUS 
              : RiskLevel.SUSPICIOUS,
          },
        });

        // Update email risk score
        const email = await prisma.email.findUnique({ where: { id: emailId } });
        if (email) {
          const newRiskScore = Math.min((email.riskScore || 0) + result.risk_score * 0.3, 100);
          await prisma.email.update({
            where: { id: emailId },
            data: { 
              riskScore: Math.round(newRiskScore),
              riskLevel: newRiskScore >= 71 ? RiskLevel.DANGEROUS : RiskLevel.SUSPICIOUS,
            },
          });
        }

        console.log(`⚠️ Malicious URL detected: ${url}`);
      }

      // Extract domain from URL
      let domain = '';
      try {
        domain = new URL(result.final_url || url).hostname;
      } catch {
        domain = url;
      }

      // Cache the URL reputation
      await prisma.urlReputationCache.upsert({
        where: { url: result.final_url || url },
        create: {
          url: result.final_url || url,
          expandedUrl: result.final_url,
          domain,
          isMalicious: result.is_malicious,
          isSuspicious: result.is_suspicious,
          isLoginPage: result.is_login_page,
          sslValid: result.ssl_valid,
          brandImpersonation: result.brand_impersonation,
          reputation: result.reputation || 'unknown',
          lastChecked: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        update: {
          isMalicious: result.is_malicious,
          isSuspicious: result.is_suspicious,
          isLoginPage: result.is_login_page,
          sslValid: result.ssl_valid,
          brandImpersonation: result.brand_impersonation,
          reputation: result.reputation || 'unknown',
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
        is_suspicious: cached.isSuspicious,
        threat_types: [],
        domain: cached.domain,
        domain_age_days: 0,
        ssl_valid: cached.sslValid ?? true,
        redirect_chain: [],
        final_url: cached.expandedUrl || url,
        page_title: '',
        is_login_page: cached.isLoginPage,
        brand_impersonation: cached.brandImpersonation,
        risk_score: cached.isMalicious ? 90 : (cached.isSuspicious ? 50 : 10),
        reputation: cached.reputation,
      };
    }

    // Call AI engine for URL analysis
    const response = await axios.post(`${AI_ENGINE_URL}/scan-url`, { url }, {
      timeout: 30000,
    });

    return response.data;

  } catch (error: any) {
    console.error('URL scan error:', error.message);
    
    // Return fallback result
    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url;
    }

    return {
      url,
      is_malicious: false,
      is_suspicious: false,
      threat_types: [],
      domain,
      domain_age_days: 0,
      ssl_valid: url.startsWith('https'),
      redirect_chain: [],
      final_url: url,
      page_title: '',
      is_login_page: false,
      brand_impersonation: null,
      risk_score: 0,
      reputation: 'unknown',
    };
  }
}

urlScanWorker.on('completed', (job, result) => {
  console.log(`✅ URL scan job ${job.id} completed: ${result.url}`);
});

urlScanWorker.on('failed', (job, err) => {
  console.error(`❌ URL scan job ${job?.id} failed:`, err.message);
});

console.log('🔗 URL Scan Worker started');
console.log('🔍 Listening for URL scan jobs...');
