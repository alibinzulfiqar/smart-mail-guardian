"""URL scanning router"""
from fastapi import APIRouter, HTTPException
import httpx
import asyncio
from urllib.parse import urlparse
import ssl
import socket
import re
import logging
from typing import Optional, List

from app.models import URLScanRequest, URLScanResponse
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Known brand domains for impersonation detection
KNOWN_BRANDS = {
    'paypal': ['paypal.com', 'paypal.me'],
    'amazon': ['amazon.com', 'amazon.co.uk', 'amazon.de', 'aws.amazon.com'],
    'apple': ['apple.com', 'icloud.com'],
    'google': ['google.com', 'gmail.com', 'accounts.google.com'],
    'microsoft': ['microsoft.com', 'outlook.com', 'live.com', 'office.com'],
    'facebook': ['facebook.com', 'fb.com', 'meta.com'],
    'netflix': ['netflix.com'],
    'dropbox': ['dropbox.com'],
    'linkedin': ['linkedin.com'],
    'twitter': ['twitter.com', 'x.com'],
}

# Suspicious TLDs
SUSPICIOUS_TLDS = {'.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.click', '.link'}


@router.post("", response_model=URLScanResponse)
async def scan_url(data: URLScanRequest):
    """
    Scan a URL for security threats.
    
    Performs comprehensive URL analysis including:
    - Domain reputation check
    - SSL certificate validation
    - Redirect chain analysis
    - Login page detection
    - Brand impersonation detection
    """
    try:
        url = data.url
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Initialize results
        is_malicious = False
        threat_types: List[str] = []
        risk_score = 0.0
        brand_impersonation: Optional[str] = None
        
        # Check for suspicious TLD
        for tld in SUSPICIOUS_TLDS:
            if domain.endswith(tld):
                threat_types.append('suspicious_tld')
                risk_score += 30
                break
        
        # Check for brand impersonation
        brand_check = check_brand_impersonation(domain)
        if brand_check:
            brand_impersonation = brand_check
            threat_types.append('brand_impersonation')
            is_malicious = True
            risk_score += 50
        
        # Check for IP-based URLs
        if is_ip_address(domain):
            threat_types.append('ip_based_url')
            risk_score += 40
        
        # Check SSL
        ssl_valid = await check_ssl(domain)
        if not ssl_valid and parsed.scheme == 'https':
            threat_types.append('invalid_ssl')
            risk_score += 20
        
        # Follow redirects and analyze
        redirect_result = await follow_redirects(url)
        redirect_chain = redirect_result.get('chain', [])
        final_url = redirect_result.get('final_url', url)
        page_title = redirect_result.get('title', '')
        is_login_page = redirect_result.get('is_login', False)
        
        if len(redirect_chain) > 3:
            threat_types.append('excessive_redirects')
            risk_score += 15
        
        if is_login_page and brand_impersonation:
            threat_types.append('credential_theft')
            risk_score += 30
        
        # Calculate final risk score
        risk_score = min(risk_score, 100)
        is_malicious = is_malicious or risk_score >= 60
        
        # Calculate reputation score (inverse of risk)
        reputation_score = max(0, 100 - risk_score)
        
        return URLScanResponse(
            url=url,
            is_malicious=is_malicious,
            threat_types=threat_types,
            domain_age_days=-1,  # Would require WHOIS lookup
            ssl_valid=ssl_valid,
            redirect_chain=redirect_chain,
            final_url=final_url,
            page_title=page_title,
            is_login_page=is_login_page,
            brand_impersonation=brand_impersonation,
            risk_score=risk_score,
            reputation_score=reputation_score
        )
        
    except Exception as e:
        logger.error(f"URL scan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def check_brand_impersonation(domain: str) -> Optional[str]:
    """Check if domain is impersonating a known brand"""
    domain_lower = domain.lower()
    
    for brand, legit_domains in KNOWN_BRANDS.items():
        # Check if domain mentions brand but isn't legitimate
        if brand in domain_lower:
            if not any(domain_lower == d or domain_lower.endswith('.' + d) for d in legit_domains):
                return brand
    
    # Check for typosquatting patterns
    typosquat_patterns = [
        (r'paypa[l1]', 'paypal'),
        (r'amaz[o0]n', 'amazon'),
        (r'app[l1]e', 'apple'),
        (r'g[o0][o0]g[l1]e', 'google'),
        (r'micr[o0]s[o0]ft', 'microsoft'),
        (r'faceb[o0][o0]k', 'facebook'),
    ]
    
    for pattern, brand in typosquat_patterns:
        if re.search(pattern, domain_lower) and brand not in domain_lower:
            return brand
    
    return None


def is_ip_address(domain: str) -> bool:
    """Check if domain is an IP address"""
    # Remove port if present
    domain = domain.split(':')[0]
    
    try:
        socket.inet_aton(domain)
        return True
    except socket.error:
        pass
    
    # Check for IPv6
    try:
        socket.inet_pton(socket.AF_INET6, domain)
        return True
    except socket.error:
        pass
    
    return False


async def check_ssl(domain: str) -> bool:
    """Check if domain has valid SSL certificate"""
    try:
        context = ssl.create_default_context()
        
        def _check():
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    return ssock.getpeercert() is not None
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _check)
        
    except Exception:
        return False


async def follow_redirects(url: str, max_redirects: int = 10) -> dict:
    """Follow URL redirects and analyze final destination"""
    chain = []
    current_url = url
    title = ""
    is_login = False
    
    try:
        async with httpx.AsyncClient(
            follow_redirects=False,
            timeout=10.0,
            verify=False
        ) as client:
            for _ in range(max_redirects):
                try:
                    response = await client.get(current_url)
                    chain.append(current_url)
                    
                    if response.status_code in (301, 302, 303, 307, 308):
                        location = response.headers.get('location', '')
                        if location:
                            if not location.startswith('http'):
                                # Relative URL
                                parsed = urlparse(current_url)
                                location = f"{parsed.scheme}://{parsed.netloc}{location}"
                            current_url = location
                            continue
                    
                    # Final destination - analyze content
                    content = response.text[:10000]  # Limit content size
                    
                    # Extract title
                    title_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
                    if title_match:
                        title = title_match.group(1).strip()[:200]
                    
                    # Detect login page
                    login_indicators = [
                        r'<input[^>]*type=["\']password["\']',
                        r'login|signin|sign-in|log-in',
                        r'username|email.*password',
                    ]
                    for pattern in login_indicators:
                        if re.search(pattern, content, re.IGNORECASE):
                            is_login = True
                            break
                    
                    break
                    
                except httpx.RequestError:
                    break
    
    except Exception as e:
        logger.warning(f"Redirect follow error: {e}")
    
    return {
        'chain': chain,
        'final_url': current_url,
        'title': title,
        'is_login': is_login
    }
