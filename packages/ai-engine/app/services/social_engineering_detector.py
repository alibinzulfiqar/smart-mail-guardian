"""Social engineering detection service"""
import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class SocialEngineeringDetector:
    """Detects social engineering tactics in emails"""
    
    def __init__(self):
        # Urgency patterns
        self.urgency_patterns = [
            'urgent', 'immediately', 'right away', 'asap', 'right now',
            'act fast', 'act now', 'don\'t delay', 'time sensitive',
            'expires today', 'expires soon', 'limited time', 'deadline',
            'within 24 hours', 'within 48 hours', 'before it\'s too late',
            'final notice', 'last warning', 'immediate action required',
        ]
        
        # Authority patterns (impersonating authority figures)
        self.authority_patterns = [
            (r'(ceo|cfo|cto|president|director|manager) of', 0.3, 'authority_title'),
            (r'from the (desk|office) of', 0.2, 'authority_desk'),
            (r'(irs|fbi|police|government|federal)', 0.4, 'government_impersonation'),
            (r'(legal|attorney|lawyer|court|lawsuit)', 0.3, 'legal_threat'),
            (r'(bank|financial institution)', 0.2, 'financial_authority'),
        ]
        
        # Fear/threat patterns
        self.fear_patterns = [
            (r'your account (will be|has been) (closed|suspended|terminated)', 0.4, 'account_threat'),
            (r'(legal action|lawsuit|prosecution)', 0.4, 'legal_threat'),
            (r'(arrest|warrant|jail|prison)', 0.5, 'arrest_threat'),
            (r'(owe|debt|outstanding balance)', 0.3, 'debt_threat'),
            (r'(penalty|fine|fee) of \$\d+', 0.3, 'penalty_threat'),
            (r'(compromised|hacked|breached)', 0.3, 'security_threat'),
            (r'your (files|data|photos) (have been|will be)', 0.4, 'data_threat'),
        ]
        
        # Reciprocity/greed patterns
        self.greed_patterns = [
            (r'(inherit|inheritance|beneficiary)', 0.5, 'inheritance_scam'),
            (r'(lottery|winner|won|prize|award)', 0.5, 'lottery_scam'),
            (r'(million|billion) (dollars|euros|pounds)', 0.5, 'large_sum'),
            (r'(unclaimed|dormant) (funds|money|account)', 0.5, 'unclaimed_funds'),
            (r'(investment|opportunity) .* return', 0.3, 'investment_scam'),
            (r'(secret|exclusive|private) (deal|offer|opportunity)', 0.3, 'exclusive_offer'),
        ]
        
        # Request patterns
        self.request_patterns = [
            (r'(send|wire|transfer) .* (money|funds|payment)', 0.5, 'money_request'),
            (r'(buy|purchase) .* gift card', 0.6, 'gift_card_request'),
            (r'(share|provide|send) .* (password|credential|login)', 0.5, 'credential_request'),
            (r'(click|open) .* (link|attachment)', 0.2, 'action_request'),
            (r'(verify|confirm) .* (identity|account|information)', 0.3, 'verification_request'),
            (r'(update|change) .* (password|credentials)', 0.3, 'credential_change'),
            (r'(download|install) .* (software|update|patch)', 0.4, 'download_request'),
        ]
    
    async def analyze(
        self,
        text: str,
        subject: str
    ) -> Dict:
        """Analyze email for social engineering tactics"""
        
        score = 0.0
        confidence = 0.0
        indicators: List[str] = []
        urgency_words: List[str] = []
        tactics: List[str] = []
        
        combined_text = f"{subject} {text}".lower()
        
        # Check urgency patterns
        for pattern in self.urgency_patterns:
            if pattern in combined_text:
                urgency_words.append(pattern)
        
        if urgency_words:
            urgency_score = min(len(urgency_words) * 0.15, 0.5)
            score += urgency_score
            tactics.append('urgency')
        
        # Check authority patterns
        for pattern, weight, indicator in self.authority_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                score += weight
                indicators.append(indicator)
                tactics.append('authority_impersonation')
        
        # Check fear patterns
        fear_matches = 0
        for pattern, weight, indicator in self.fear_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                score += weight
                fear_matches += 1
                indicators.append(indicator)
        
        if fear_matches > 0:
            tactics.append('fear_manipulation')
        
        # Check greed patterns
        for pattern, weight, indicator in self.greed_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                score += weight
                indicators.append(indicator)
                tactics.append('greed_exploitation')
        
        # Check request patterns
        request_matches = 0
        for pattern, weight, indicator in self.request_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                score += weight
                request_matches += 1
                indicators.append(indicator)
        
        if request_matches > 0:
            tactics.append('action_request')
        
        # Check for CEO fraud / BEC patterns
        bec_score = self._check_bec_patterns(combined_text, subject)
        if bec_score > 0:
            score += bec_score
            tactics.append('business_email_compromise')
        
        # Calculate confidence based on number of tactics used
        unique_tactics = set(tactics)
        confidence = min(len(unique_tactics) * 0.2 + 0.3, 0.95)
        
        # Normalize score
        score = min(score, 1.0)
        
        # Build reason
        if score > 0.6:
            reason = f"Multiple social engineering tactics detected: {', '.join(unique_tactics)}."
        elif score > 0.3:
            reason = "Some manipulation tactics identified."
        else:
            reason = ""
        
        return {
            'score': score,
            'confidence': confidence,
            'indicators': indicators,
            'urgency_words': urgency_words,
            'tactics': list(unique_tactics),
            'reason': reason
        }
    
    def _check_bec_patterns(self, text: str, subject: str) -> float:
        """Check for Business Email Compromise patterns"""
        score = 0.0
        
        bec_patterns = [
            (r'(are you available|are you in the office|are you free)', 0.2),
            (r'(need you to|i need a favor|quick favor)', 0.25),
            (r'(wire transfer|bank transfer|payment)', 0.2),
            (r'(confidential|keep this between us|don\'t tell anyone)', 0.3),
            (r'(vendor|supplier) .* (payment|invoice)', 0.2),
            (r'(updated|new) (bank|account) (details|information)', 0.4),
        ]
        
        subject_patterns = [
            (r'urgent', 0.1),
            (r'request', 0.1),
            (r'important', 0.1),
            (r'quick (question|favor)', 0.15),
        ]
        
        for pattern, weight in bec_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                score += weight
        
        for pattern, weight in subject_patterns:
            if re.search(pattern, subject.lower(), re.IGNORECASE):
                score += weight
        
        return min(score, 0.6)
