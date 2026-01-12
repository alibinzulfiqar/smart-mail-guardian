"""Spam detection service"""
import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class SpamDetector:
    """Detects spam emails"""
    
    def __init__(self):
        # Spam patterns
        self.spam_patterns = [
            # Marketing spam
            (r'unsubscribe', 0.1, 'has_unsubscribe'),
            (r'click here to (unsubscribe|remove)', 0.15, 'unsubscribe_link'),
            (r'(special|limited|exclusive) offer', 0.3, 'special_offer'),
            (r'act now|order now|buy now', 0.25, 'call_to_action'),
            (r'free (gift|trial|sample|shipping)', 0.3, 'free_offer'),
            (r'\d+% (off|discount|sale)', 0.2, 'discount_offer'),
            (r'(satisfaction|money.back) guarantee', 0.2, 'guarantee'),
            (r'no obligation', 0.2, 'no_obligation'),
            (r'risk.free', 0.2, 'risk_free'),
            
            # Urgency spam
            (r'(hurry|rush|limited time)', 0.25, 'urgency'),
            (r'(expires|ending) (soon|today|tomorrow)', 0.25, 'expiration'),
            (r'last chance', 0.3, 'last_chance'),
            (r'while (supplies|stocks) last', 0.25, 'limited_supply'),
            
            # Financial spam
            (r'make money (fast|online|from home)', 0.4, 'money_making'),
            (r'(earn|make) \$\d+', 0.3, 'income_claim'),
            (r'work from home', 0.2, 'work_from_home'),
            (r'(double|triple) your (money|income)', 0.5, 'income_doubling'),
            (r'financial freedom', 0.3, 'financial_freedom'),
            (r'(passive|residual) income', 0.3, 'passive_income'),
            
            # Adult/inappropriate
            (r'(casino|poker|gambling|bet|lottery)', 0.4, 'gambling'),
            (r'weight loss|lose weight|diet pill', 0.4, 'weight_loss'),
            (r'(viagra|cialis|pharmacy|prescription)', 0.5, 'pharmaceutical'),
            
            # Spammy formatting
            (r'[A-Z]{5,}', 0.15, 'excessive_caps'),
            (r'!{2,}', 0.15, 'excessive_exclamation'),
            (r'\${2,}', 0.2, 'multiple_dollar_signs'),
        ]
        
        # Known spam sender patterns
        self.spam_sender_patterns = [
            r'noreply.*@',
            r'newsletter.*@',
            r'marketing.*@',
            r'promo.*@',
            r'offer.*@',
            r'deals.*@',
        ]
    
    async def analyze(
        self,
        text: str,
        from_address: str
    ) -> Dict:
        """Analyze email for spam indicators"""
        
        score = 0.0
        confidence = 0.0
        indicators: List[str] = []
        
        text_lower = text.lower()
        
        # Check spam patterns
        pattern_matches = 0
        for pattern, weight, indicator in self.spam_patterns:
            matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
            if matches > 0:
                # Diminishing returns for multiple matches
                score += weight * min(matches, 3) / 2
                pattern_matches += 1
                indicators.append(indicator)
        
        # Check sender patterns
        sender_score = self._check_sender(from_address)
        score += sender_score
        
        # Check text characteristics
        char_score = self._analyze_text_characteristics(text)
        score += char_score
        
        # Calculate confidence
        if pattern_matches > 0:
            confidence = min(pattern_matches / 8, 1.0)
        
        # Normalize score
        score = min(score, 1.0)
        confidence = max(confidence, 0.4) if score > 0.3 else 0.5
        
        return {
            'score': score,
            'confidence': confidence,
            'indicators': indicators
        }
    
    def _check_sender(self, from_address: str) -> float:
        """Check sender for spam patterns"""
        score = 0.0
        email_lower = from_address.lower()
        
        for pattern in self.spam_sender_patterns:
            if re.match(pattern, email_lower):
                score += 0.15
                break
        
        return score
    
    def _analyze_text_characteristics(self, text: str) -> float:
        """Analyze text characteristics for spam signals"""
        score = 0.0
        
        # Check ratio of uppercase letters
        if len(text) > 0:
            upper_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if upper_ratio > 0.3:
                score += 0.2
        
        # Check for excessive URLs
        url_count = len(re.findall(r'https?://', text, re.IGNORECASE))
        if url_count > 5:
            score += 0.2
        
        # Check for HTML in plain text
        if '<html' in text.lower() or '<body' in text.lower():
            score += 0.1
        
        # Check for excessive whitespace or formatting
        if '  ' * 5 in text or '\n' * 5 in text:
            score += 0.1
        
        return score
