# Ailo Chatbot Backend

FastAPI backend that provides streaming AI chat responses using a local Ollama instance.

## What It Does

- Accepts chat messages via REST API
- Streams responses token-by-token from Ollama
- Handles CORS for frontend integration

## Prerequisites

**Before running this backend, you need:**

1. **Ollama installed and running**
   - Download: https://ollama.com
   - Must be accessible (default: `http://localhost:11434`)
   - Model installed: `ollama pull gemma3:4b-it-qat`

2. **Python 3.11+**

**Note:** This backend connects to a local Ollama instance. If you get connection errors, make sure Ollama is running locally.

## Tech Stack

- **FastAPI** - Web framework
- **Ollama** - Local LLM inference
- **httpx** - Async HTTP client

## Setup

### Quick Setup (Recommended)

```bash
# Run the setup script (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Edit .env with your Ollama settings
nano .env

# Run the server
source venv/bin/activate
python app.py
```

### Manual Setup

**1. Install Dependencies**

```bash
pip install -r requirements.txt
```

**2. Configure Environment**

Create a `.env` file:

```bash
OLLAMA_HOST=http://localhost:11434
MODEL_NAME=gemma3:4b-it-qat
CORS_ORIGINS=*
```

**3. Run**

```bash
python app.py
```

Server starts at `http://localhost:8000`

## API Usage

### Chat Endpoint

```bash
POST /api/chat

Body:
{
  "message": "Hello!",
  "system_prompt": "You're name is Ailo" // optional
}

Response: Server-Sent Events (streaming)
```

### Test It

**Local:**
```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Software engineering?"}'
```

## Project Structure

```
backend/
├── app.py              # Main application
├── requirements.txt    # Python dependencies
├── setup.sh            # Automated setup script
├── .env.example        # Config template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Production Deployment

Deploy the backend to any server that supports Python and has network access to your Ollama instance. Set `VITE_API_BASE` in the frontend `.env` to point to your deployed API URL.