"""Phishing detection service"""
import re
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class PhishingDetector:
    """Detects phishing attempts in emails"""
    
    def __init__(self):
        # Phishing keyword patterns
        self.phishing_patterns = [
            (r'verify your (account|identity|email)', 0.4, 'account_verification'),
            (r'confirm your (account|identity|payment)', 0.4, 'confirmation_request'),
            (r'your account (has been|will be|is) (suspended|locked|disabled)', 0.5, 'account_threat'),
            (r'unusual (activity|login|sign-in)', 0.4, 'unusual_activity'),
            (r'update your (password|credentials|information)', 0.3, 'credential_update'),
            (r'click (here|below|the link) to', 0.2, 'click_urgency'),
            (r'(expire|expires|expiring) (in|within) \d+', 0.3, 'time_pressure'),
            (r'failure to (verify|confirm|update)', 0.4, 'consequence_threat'),
            (r'unauthorized (access|transaction|activity)', 0.4, 'security_alert'),
            (r'reset your password', 0.3, 'password_reset'),
            (r'dear (customer|user|member|valued)', 0.2, 'generic_greeting'),
            (r'(won|winner|winning|lottery|prize)', 0.5, 'lottery_scam'),
            (r'(million|thousand) (dollars|euros|pounds)', 0.5, 'money_promise'),
            (r'(inheritance|beneficiary|next of kin)', 0.6, 'inheritance_scam'),
            (r'wire transfer|western union|moneygram', 0.5, 'wire_transfer'),
        ]
        
        # Suspicious sender patterns
        self.suspicious_sender_patterns = [
            r'.*@.*\d{4,}.*\..*',  # Email with many numbers
            r'.*support.*@(?!microsoft|google|apple|amazon).*',  # Fake support
            r'.*security.*@(?!microsoft|google|apple|amazon).*',  # Fake security
            r'.*admin.*@(?!microsoft|google|apple|amazon).*',  # Fake admin
        ]
        
        # Known safe domains
        self.safe_domains = {
            'google.com', 'gmail.com', 'microsoft.com', 'outlook.com',
            'apple.com', 'amazon.com', 'facebook.com', 'linkedin.com',
            'twitter.com', 'github.com', 'stripe.com', 'paypal.com'
        }
    
    async def analyze(
        self,
        text: str,
        from_address: str,
        from_name: Optional[str] = None,
        headers: Optional[Dict] = None
    ) -> Dict:
        """Analyze email for phishing indicators"""
        
        score = 0.0
        confidence = 0.0
        indicators: List[str] = []
        reasons: List[str] = []
        
        text_lower = text.lower()
        
        # Check phishing patterns
        pattern_matches = 0
        for pattern, weight, indicator in self.phishing_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                score += weight
                pattern_matches += 1
                indicators.append(indicator)
        
        # Normalize score
        if pattern_matches > 0:
            confidence = min(pattern_matches / 5, 1.0)  # More matches = more confident
        
        # Analyze sender
        sender_score, sender_reason = self._analyze_sender(from_address, from_name)
        score += sender_score
        if sender_reason:
            reasons.append(sender_reason)
        
        # Check headers for spoofing indicators
        if headers:
            header_score, header_indicators = self._analyze_headers(headers)
            score += header_score
            indicators.extend(header_indicators)
        
        # Check for suspicious URL patterns in text
        url_score = self._analyze_urls_in_text(text)
        score += url_score
        
        # Calculate sender reputation
        sender_reputation = self._get_sender_reputation(from_address)
        
        # Normalize final score
        score = min(score, 1.0)
        confidence = max(confidence, 0.3) if score > 0.3 else 0.5
        
        # Build reason string
        if score > 0.7:
            reason = "Multiple strong phishing indicators detected."
        elif score > 0.4:
            reason = "Some phishing patterns detected. Review carefully."
        else:
            reason = ""
        
        return {
            'score': score,
            'confidence': confidence,
            'indicators': indicators,
            'reason': reason,
            'sender_reputation': sender_reputation
        }
    
    def _analyze_sender(self, from_address: str, from_name: Optional[str]) -> tuple:
        """Analyze sender for suspicious patterns"""
        score = 0.0
        reason = ""
        
        email_lower = from_address.lower()
        
        # Check suspicious patterns
        for pattern in self.suspicious_sender_patterns:
            if re.match(pattern, email_lower, re.IGNORECASE):
                score += 0.3
                reason = "Suspicious sender address pattern"
                break
        
        # Check domain reputation
        domain = email_lower.split('@')[-1] if '@' in email_lower else ''
        
        # Check for display name spoofing
        if from_name:
            name_lower = from_name.lower()
            # Check if name mentions brand but email isn't from that brand
            brands = ['paypal', 'amazon', 'apple', 'google', 'microsoft', 'facebook']
            for brand in brands:
                if brand in name_lower and brand not in domain:
                    score += 0.4
                    reason = f"Display name impersonating {brand}"
                    break
        
        return score, reason
    
    def _analyze_headers(self, headers: Dict) -> tuple:
        """Analyze email headers for spoofing"""
        score = 0.0
        indicators = []
        
        # Check SPF
        received_spf = headers.get('received-spf', '').lower()
        if 'fail' in received_spf or 'softfail' in received_spf:
            score += 0.3
            indicators.append('spf_fail')
        
        # Check DKIM
        dkim = headers.get('dkim-signature', '')
        auth_results = headers.get('authentication-results', '').lower()
        if 'dkim=fail' in auth_results:
            score += 0.3
            indicators.append('dkim_fail')
        
        # Check DMARC
        if 'dmarc=fail' in auth_results:
            score += 0.3
            indicators.append('dmarc_fail')
        
        # Check for header injection attempts
        for key, value in headers.items():
            if '\n' in str(value) or '\r' in str(value):
                score += 0.2
                indicators.append('header_injection')
                break
        
        return score, indicators
    
    def _analyze_urls_in_text(self, text: str) -> float:
        """Analyze URLs found in text"""
        score = 0.0
        
        # Look for suspicious URL patterns
        suspicious_patterns = [
            r'http://[^\s]*\.(tk|ml|ga|cf|gq)',  # Free TLDs
            r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',  # IP addresses
            r'bit\.ly|tinyurl|t\.co|goo\.gl',  # URL shorteners
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                score += 0.2
        
        return min(score, 0.5)
    
    def _get_sender_reputation(self, from_address: str) -> float:
        """Get sender reputation score (0-1, higher is better)"""
        domain = from_address.lower().split('@')[-1] if '@' in from_address else ''
        
        if domain in self.safe_domains:
            return 0.9
        
        # Check for corporate email patterns (not free email)
        free_email_providers = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'}
        if domain not in free_email_providers and '.' in domain:
            return 0.6  # Corporate email, neutral reputation
        
        return 0.4  # Unknown/free email
