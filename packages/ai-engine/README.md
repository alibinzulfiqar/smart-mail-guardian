# Smart Mail Guardian - AI Engine

AI-powered email threat analysis engine using Python and FastAPI.

## Features

- **Phishing Detection**: Identifies phishing attempts using pattern matching and heuristics
- **Spam Detection**: Detects spam emails based on content analysis
- **Social Engineering Detection**: Identifies manipulation tactics
- **URL Scanning**: Analyzes URLs for threats, brand impersonation, and malicious content
- **Attachment Analysis**: Evaluates attachments for malware indicators

## Quick Start

### Prerequisites

- Python 3.11+
- Redis (optional, for caching)

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### Running the Service

```bash
# Development mode
python run.py

# Or with uvicorn directly
uvicorn app.main:app --reload --port 8000
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### POST /analyze
Analyze an email for threats.

```json
{
  "subject": "Urgent: Verify your account",
  "body_text": "Dear Customer, Click here to verify...",
  "from_address": "support@suspicious-domain.com",
  "from_name": "Support Team",
  "to_addresses": ["victim@example.com"]
}
```

### POST /scan-url
Scan a URL for security threats.

```json
{
  "url": "https://suspicious-site.com/login"
}
```

### GET /health
Health check endpoint.

## Configuration

See `.env.example` for all available configuration options.

## Model Upgrades

The current implementation uses heuristic-based detection. To enable ML-based detection:

1. Uncomment the model loading code in `app/services/model_service.py`
2. Install PyTorch: `pip install torch`
3. Configure the model name in `.env`

## License

MIT
