import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { prisma, EmailStatus, ThreatLevel, ActionTaken } from '@smart-mail-guardian/database';
import { RISK_THRESHOLDS, THREAT_WEIGHTS } from '@smart-mail-guardian/shared';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const urlScanQueue = new Queue('url-scan', { connection });

interface AIAnalysisResult {
  phishing_score: number;
  spam_score: number;
  malware_score: number;
  social_engineering_score: number;
  threat_types: string[];
  confidence: number;
  explanation: string;
  extracted_urls: string[];
  sender_reputation: number;
  urgency_indicators: string[];
}

// Analysis Worker
const analysisWorker = new Worker(
  'email-analysis',
  async (job) => {
    const { emailId } = job.data;
    console.log(`🔍 Analyzing email: ${emailId}`);

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { 
        mailbox: true,
        attachments: true,
      },
    });

    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    try {
      // Call AI Engine for analysis
      const aiResult = await analyzeWithAI(email);

      // Calculate overall risk score
      const riskScore = calculateRiskScore(aiResult);
      const threatLevel = determineThreatLevel(riskScore);

      // Save analysis result
      const analysis = await prisma.aIAnalysisResult.create({
        data: {
          emailId,
          phishingScore: aiResult.phishing_score,
          spamScore: aiResult.spam_score,
          malwareScore: aiResult.malware_score,
          socialEngineeringScore: aiResult.social_engineering_score,
          overallRiskScore: riskScore,
          threatLevel,
          confidence: aiResult.confidence,
          threatTypes: aiResult.threat_types,
          indicators: {
            urgency: aiResult.urgency_indicators,
            urls: aiResult.extracted_urls,
          },
          explanation: aiResult.explanation,
        },
      });

      // Update email status
      await prisma.email.update({
        where: { id: emailId },
        data: {
          riskScore,
          status: getEmailStatus(threatLevel),
        },
      });

      // Queue URL scanning if suspicious URLs found
      if (aiResult.extracted_urls.length > 0 && riskScore > RISK_THRESHOLDS.LOW) {
        for (const url of aiResult.extracted_urls) {
          await urlScanQueue.add('scan', { emailId, url });
        }
      }

      // Create security event for high-risk emails
      if (threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL) {
        await prisma.securityEvent.create({
          data: {
            userId: email.mailbox.userId,
            emailId,
            eventType: 'THREAT_DETECTED',
            threatLevel,
            description: `Threat detected: ${aiResult.threat_types.join(', ')}`,
            metadata: {
              riskScore,
              confidence: aiResult.confidence,
            },
            actionTaken: threatLevel === ThreatLevel.CRITICAL 
              ? ActionTaken.QUARANTINED 
              : ActionTaken.LABELED,
          },
        });

        // Quarantine critical emails
        if (threatLevel === ThreatLevel.CRITICAL) {
          await prisma.email.update({
            where: { id: emailId },
            data: { status: EmailStatus.QUARANTINED },
          });
        }
      }

      console.log(`✅ Analysis complete for ${emailId}: Risk=${riskScore}, Level=${threatLevel}`);
      return { riskScore, threatLevel, analysisId: analysis.id };

    } catch (error: any) {
      console.error(`❌ Analysis failed for ${emailId}:`, error.message);
      
      // Mark as pending retry
      await prisma.email.update({
        where: { id: emailId },
        data: { status: EmailStatus.PENDING },
      });
      
      throw error;
    }
  },
  { connection, concurrency: 5 }
);

async function analyzeWithAI(email: any): Promise<AIAnalysisResult> {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/analyze`, {
      subject: email.subject,
      body_text: email.bodyText,
      body_html: email.bodyHtml,
      from_address: email.from,
      from_name: email.fromName,
      to_addresses: email.to,
      headers: email.headers,
      attachments: email.attachments?.map((a: any) => ({
        filename: a.filename,
        mime_type: a.mimeType,
        size: a.size,
      })),
    }, {
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    console.error('AI Engine error:', error.message);
    
    // Fallback to basic heuristics if AI engine is unavailable
    return fallbackAnalysis(email);
  }
}

function fallbackAnalysis(email: any): AIAnalysisResult {
  const text = `${email.subject} ${email.bodyText}`.toLowerCase();
  
  // Basic heuristics
  const urgencyWords = ['urgent', 'immediately', 'act now', 'limited time', 'expires'];
  const phishingWords = ['verify your account', 'confirm your identity', 'suspended', 'unusual activity'];
  const spamWords = ['winner', 'lottery', 'million dollars', 'click here', 'free gift'];
  
  const urgencyScore = urgencyWords.filter(w => text.includes(w)).length * 0.15;
  const phishingScore = Math.min(phishingWords.filter(w => text.includes(w)).length * 0.25, 1);
  const spamScore = Math.min(spamWords.filter(w => text.includes(w)).length * 0.2, 1);

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  const urls = text.match(urlRegex) || [];

  return {
    phishing_score: phishingScore,
    spam_score: spamScore,
    malware_score: 0,
    social_engineering_score: urgencyScore,
    threat_types: [],
    confidence: 0.5, // Low confidence for fallback
    explanation: 'Analysis performed using basic heuristics (AI engine unavailable)',
    extracted_urls: urls,
    sender_reputation: 0.5,
    urgency_indicators: urgencyWords.filter(w => text.includes(w)),
  };
}

function calculateRiskScore(result: AIAnalysisResult): number {
  const weightedScore = 
    result.phishing_score * THREAT_WEIGHTS.phishing +
    result.spam_score * THREAT_WEIGHTS.spam +
    result.malware_score * THREAT_WEIGHTS.malware +
    result.social_engineering_score * THREAT_WEIGHTS.socialEngineering +
    (1 - result.sender_reputation) * THREAT_WEIGHTS.senderReputation;

  return Math.round(Math.min(weightedScore * 100, 100));
}

function determineThreatLevel(riskScore: number): ThreatLevel {
  if (riskScore >= RISK_THRESHOLDS.CRITICAL) return ThreatLevel.CRITICAL;
  if (riskScore >= RISK_THRESHOLDS.HIGH) return ThreatLevel.HIGH;
  if (riskScore >= RISK_THRESHOLDS.MEDIUM) return ThreatLevel.MEDIUM;
  if (riskScore >= RISK_THRESHOLDS.LOW) return ThreatLevel.LOW;
  return ThreatLevel.SAFE;
}

function getEmailStatus(threatLevel: ThreatLevel): EmailStatus {
  switch (threatLevel) {
    case ThreatLevel.CRITICAL:
      return EmailStatus.QUARANTINED;
    case ThreatLevel.HIGH:
    case ThreatLevel.MEDIUM:
      return EmailStatus.SUSPICIOUS;
    default:
      return EmailStatus.SAFE;
  }
}

analysisWorker.on('completed', (job, result) => {
  console.log(`✅ Analysis job ${job.id} completed: Score=${result.riskScore}`);
});

analysisWorker.on('failed', (job, err) => {
  console.error(`❌ Analysis job ${job?.id} failed:`, err.message);
});

console.log('🔬 Analysis Worker started');
console.log('🔍 Listening for email analysis jobs...');
