"""Pydantic models for API requests and responses"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ThreatType(str, Enum):
    PHISHING = "phishing"
    SPAM = "spam"
    MALWARE = "malware"
    SOCIAL_ENGINEERING = "social_engineering"
    BEC = "business_email_compromise"
    CREDENTIAL_THEFT = "credential_theft"
    BRAND_IMPERSONATION = "brand_impersonation"


class EmailAttachment(BaseModel):
    """Email attachment metadata"""
    filename: str
    mime_type: str
    size: int


class AnalysisRequest(BaseModel):
    """Email analysis request"""
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    from_address: str
    from_name: Optional[str] = None
    to_addresses: List[str] = []
    headers: Optional[Dict[str, str]] = {}
    attachments: Optional[List[EmailAttachment]] = []


class AnalysisResponse(BaseModel):
    """Email analysis response"""
    phishing_score: float = Field(..., ge=0, le=1)
    spam_score: float = Field(..., ge=0, le=1)
    malware_score: float = Field(..., ge=0, le=1)
    social_engineering_score: float = Field(..., ge=0, le=1)
    threat_types: List[str] = []
    confidence: float = Field(..., ge=0, le=1)
    explanation: str
    extracted_urls: List[str] = []
    sender_reputation: float = Field(..., ge=0, le=1)
    urgency_indicators: List[str] = []
    risk_factors: List[str] = []


class URLScanRequest(BaseModel):
    """URL scan request"""
    url: str


class URLScanResponse(BaseModel):
    """URL scan response"""
    url: str
    is_malicious: bool
    threat_types: List[str] = []
    domain_age_days: int = -1
    ssl_valid: bool = True
    redirect_chain: List[str] = []
    final_url: str
    page_title: str = ""
    is_login_page: bool = False
    brand_impersonation: Optional[str] = None
    risk_score: float = Field(..., ge=0, le=100)
    reputation_score: float = Field(..., ge=0, le=100)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    version: str
    uptime_seconds: float
