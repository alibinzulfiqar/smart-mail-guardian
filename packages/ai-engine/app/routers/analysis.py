"""Email analysis router"""
from fastapi import APIRouter, Request, HTTPException
from typing import List
import re
import logging

from app.models import AnalysisRequest, AnalysisResponse
from app.services.phishing_detector import PhishingDetector
from app.services.spam_detector import SpamDetector
from app.services.social_engineering_detector import SocialEngineeringDetector

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize detectors
phishing_detector = PhishingDetector()
spam_detector = SpamDetector()
social_engineering_detector = SocialEngineeringDetector()


@router.post("", response_model=AnalysisResponse)
async def analyze_email(request: Request, data: AnalysisRequest):
    """
    Analyze an email for threats.
    
    Returns comprehensive threat analysis including phishing, spam,
    malware indicators, and social engineering tactics.
    """
    try:
        model_service = request.app.state.model_service
        
        # Combine text content
        text_content = f"{data.subject}\n{data.body_text or ''}"
        
        # Run all detectors
        phishing_result = await phishing_detector.analyze(
            text=text_content,
            from_address=data.from_address,
            from_name=data.from_name,
            headers=data.headers or {}
        )
        
        spam_result = await spam_detector.analyze(
            text=text_content,
            from_address=data.from_address
        )
        
        social_result = await social_engineering_detector.analyze(
            text=text_content,
            subject=data.subject
        )
        
        # Extract URLs from content
        urls = extract_urls(text_content)
        if data.body_html:
            urls.extend(extract_urls(data.body_html))
        urls = list(set(urls))  # Deduplicate
        
        # Analyze attachments for malware indicators
        malware_score = analyze_attachments(data.attachments or [])
        
        # Combine threat types
        threat_types = []
        if phishing_result['score'] > 0.7:
            threat_types.append('phishing')
        if spam_result['score'] > 0.6:
            threat_types.append('spam')
        if malware_score > 0.5:
            threat_types.append('malware')
        if social_result['score'] > 0.6:
            threat_types.append('social_engineering')
        
        # Calculate overall confidence
        confidence = (
            phishing_result['confidence'] * 0.4 +
            spam_result['confidence'] * 0.2 +
            social_result['confidence'] * 0.4
        )
        
        # Build explanation
        explanation = build_explanation(
            phishing_result,
            spam_result,
            social_result,
            malware_score,
            urls
        )
        
        # Combine risk factors
        risk_factors = []
        risk_factors.extend(phishing_result.get('indicators', []))
        risk_factors.extend(social_result.get('indicators', []))
        
        return AnalysisResponse(
            phishing_score=phishing_result['score'],
            spam_score=spam_result['score'],
            malware_score=malware_score,
            social_engineering_score=social_result['score'],
            threat_types=threat_types,
            confidence=confidence,
            explanation=explanation,
            extracted_urls=urls[:20],  # Limit to 20 URLs
            sender_reputation=phishing_result.get('sender_reputation', 0.5),
            urgency_indicators=social_result.get('urgency_words', []),
            risk_factors=risk_factors[:10]  # Limit risk factors
        )
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_urls(text: str) -> List[str]:
    """Extract URLs from text"""
    url_pattern = r'https?://[^\s<>"\')\]]+|www\.[^\s<>"\')\]]+'
    urls = re.findall(url_pattern, text, re.IGNORECASE)
    
    # Clean and normalize URLs
    cleaned = []
    for url in urls:
        # Remove trailing punctuation
        url = re.sub(r'[.,;:!?]+$', '', url)
        if not url.startswith('http'):
            url = 'http://' + url
        cleaned.append(url)
    
    return cleaned


def analyze_attachments(attachments: list) -> float:
    """Analyze attachments for malware indicators"""
    if not attachments:
        return 0.0
    
    dangerous_extensions = {
        '.exe': 1.0, '.bat': 0.9, '.cmd': 0.9, '.com': 0.9,
        '.scr': 0.9, '.pif': 0.9, '.vbs': 0.85, '.js': 0.8,
        '.jar': 0.8, '.msi': 0.7, '.dll': 0.8, '.ps1': 0.85,
        '.hta': 0.9, '.wsf': 0.85, '.iso': 0.6, '.img': 0.6,
    }
    
    suspicious_extensions = {
        '.zip': 0.3, '.rar': 0.3, '.7z': 0.3, '.tar': 0.2,
        '.doc': 0.2, '.docm': 0.7, '.xlsm': 0.7, '.pptm': 0.7,
        '.pdf': 0.1, '.html': 0.4, '.htm': 0.4,
    }
    
    max_score = 0.0
    
    for att in attachments:
        filename = att.filename.lower() if hasattr(att, 'filename') else att.get('filename', '').lower()
        
        for ext, score in dangerous_extensions.items():
            if filename.endswith(ext):
                max_score = max(max_score, score)
                break
        else:
            for ext, score in suspicious_extensions.items():
                if filename.endswith(ext):
                    max_score = max(max_score, score)
                    break
    
    return max_score


def build_explanation(phishing, spam, social, malware, urls) -> str:
    """Build human-readable explanation of analysis results"""
    explanations = []
    
    if phishing['score'] > 0.7:
        explanations.append(f"High phishing risk detected ({phishing['score']:.0%}). {phishing.get('reason', '')}")
    elif phishing['score'] > 0.4:
        explanations.append(f"Moderate phishing indicators ({phishing['score']:.0%}).")
    
    if spam['score'] > 0.6:
        explanations.append(f"Spam characteristics detected ({spam['score']:.0%}).")
    
    if social['score'] > 0.6:
        explanations.append(f"Social engineering tactics identified ({social['score']:.0%}). {social.get('reason', '')}")
    
    if malware > 0.5:
        explanations.append(f"Suspicious attachments detected (risk: {malware:.0%}).")
    
    if len(urls) > 5:
        explanations.append(f"Contains {len(urls)} URLs - review carefully.")
    
    if not explanations:
        return "No significant threats detected."
    
    return " ".join(explanations)
