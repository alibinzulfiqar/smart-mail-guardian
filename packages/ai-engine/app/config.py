"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    LOG_LEVEL: str = "info"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Model Configuration
    MODEL_NAME: str = "microsoft/deberta-v3-small"
    USE_GPU: bool = False
    MAX_SEQUENCE_LENGTH: int = 512
    
    # Thresholds
    PHISHING_THRESHOLD: float = 0.7
    SPAM_THRESHOLD: float = 0.6
    MALWARE_THRESHOLD: float = 0.8
    
    # External APIs
    VIRUSTOTAL_API_KEY: str = ""
    GOOGLE_SAFE_BROWSING_KEY: str = ""
    URLSCAN_API_KEY: str = ""
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
