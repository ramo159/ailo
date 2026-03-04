import os
import json
import logging
from typing import AsyncGenerator, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Header, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration from .env
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "gemma3:4b-it-qat")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
API_KEY = os.getenv("API_KEY")

# Track app start time for uptime
app_start_time = None

# Initialize rate limiter
RATE_LIMIT_STR = os.getenv("RATE_LIMIT", "20/minute")
try:
    rate_parts = RATE_LIMIT_STR.split("/")
    RATE_LIMIT_REQUESTS = int(rate_parts[0])
    RATE_LIMIT_WINDOW = 60  # seconds
except (ValueError, IndexError):
    RATE_LIMIT_REQUESTS = 20
    RATE_LIMIT_WINDOW = 60

# Rate Limiter
class RateLimiter:
    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = datetime.now()

        cutoff_time = now - timedelta(seconds=self.window_seconds)
        self.requests[client_ip] = [
            timestamp for timestamp in self.requests[client_ip]
            if timestamp > cutoff_time
        ]

        if len(self.requests[client_ip]) >= self.max_requests:
            return False

        self.requests[client_ip].append(now)
        return True

    def get_remaining(self, client_ip: str) -> int:
        return max(0, self.max_requests - len(self.requests[client_ip]))

# Initialize rate limiter with values from .env
rate_limiter = RateLimiter(max_requests=RATE_LIMIT_REQUESTS, window_seconds=RATE_LIMIT_WINDOW)

# Lifespan handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    global app_start_time
    app_start_time = datetime.utcnow()
    yield
    await http_client.aclose()

# Initialize FastAPI
app = FastAPI(title="Ailo Chatbot API", lifespan=lifespan)


# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP client for Ollama
http_client = httpx.AsyncClient(timeout=120.0)


# Health check helper functions
async def check_ollama_connectivity(timeout: float = 5.0) -> dict:
    """Check if Ollama is reachable"""
    start_time = datetime.utcnow()

    try:
        response = await http_client.get(
            f"{OLLAMA_HOST}/api/tags",
            timeout=timeout
        )
        response.raise_for_status()

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        return {
            "connected": True,
            "response_time_seconds": round(elapsed, 3),
            "error": None
        }
    except httpx.TimeoutException:
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        return {
            "connected": False,
            "response_time_seconds": round(elapsed, 3),
            "error": "Ollama request timed out"
        }
    except httpx.HTTPError as e:
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        return {
            "connected": False,
            "response_time_seconds": round(elapsed, 3),
            "error": f"HTTP error: {str(e)}"
        }
    except Exception as e:
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        return {
            "connected": False,
            "response_time_seconds": round(elapsed, 3),
            "error": f"Error: {str(e)}"
        }

async def check_model_availability(timeout: float = 5.0) -> dict:
    """Check if configured model is available"""
    try:
        response = await http_client.get(
            f"{OLLAMA_HOST}/api/tags",
            timeout=timeout
        )
        response.raise_for_status()

        data = response.json()
        models = data.get("models", [])
        model_names = [m.get("name") for m in models]
        is_available = MODEL_NAME in model_names

        return {
            "available": is_available,
            "model_name": MODEL_NAME,
            "error": None if is_available else f"Model '{MODEL_NAME}' not found"
        }
    except Exception as e:
        return {
            "available": False,
            "model_name": MODEL_NAME,
            "error": f"Failed to check model: {str(e)}"
        }

def get_uptime_seconds() -> float:
    """Get uptime in seconds"""
    if app_start_time is None:
        return 0.0
    return (datetime.utcnow() - app_start_time).total_seconds()

def format_uptime(seconds: float) -> str:
    """Format uptime as readable string"""
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{secs}s")

    return " ".join(parts)


# Request model
class ChatRequest(BaseModel):
    message: str
    system_prompt: str | None = None

# Health check response models
class OllamaStatus(BaseModel):
    model_config = {"protected_namespaces": ()}

    connected: bool
    response_time_seconds: float
    model_available: bool
    model_name: str
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    uptime_formatted: str
    ollama: OllamaStatus
    timestamp: str

class LivenessResponse(BaseModel):
    status: str = "alive"
    timestamp: str

class ReadinessResponse(BaseModel):
    status: str
    ollama_connected: bool
    reason: Optional[str] = None
    timestamp: str

# API Authentication
async def verify_api_key(x_api_key: str = Header(None, description="API Authentication")):
    """Verify API key if configured"""
    if not API_KEY:
        return None

    # Check if correct API key
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Wrong or missing API key. Include 'x-api-key' header with valid key."
        )

    return x_api_key


@app.get("/")
async def root():
    """API info"""
    return {
        "message": "Ailo Chatbot API",
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health/live", response_model=LivenessResponse)
async def liveness_probe():
    """Liveness probe - check if service is running"""
    return LivenessResponse(
        status="alive",
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/health/ready", response_model=ReadinessResponse)
async def readiness_probe():
    """Readiness probe - check if service is ready to handle requests"""
    connectivity = await check_ollama_connectivity(timeout=3.0)

    if connectivity["connected"]:
        return ReadinessResponse(
            status="ready",
            ollama_connected=True,
            reason=None,
            timestamp=datetime.utcnow().isoformat()
        )
    else:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "ollama_connected": False,
                "reason": connectivity["error"],
                "timestamp": datetime.utcnow().isoformat()
            }
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check"""
    # Check Ollama connectivity
    connectivity = await check_ollama_connectivity(timeout=10.0)

    # Check model availability if connected
    if connectivity["connected"]:
        model_check = await check_model_availability(timeout=10.0)
        model_available = model_check["available"]
        error_message = model_check["error"]
    else:
        model_available = False
        error_message = connectivity["error"]

    # Determine overall health
    is_healthy = connectivity["connected"] and model_available

    # Get uptime
    uptime_secs = get_uptime_seconds()

    # Build response
    response = HealthResponse(
        status="healthy" if is_healthy else "unhealthy",
        uptime_seconds=uptime_secs,
        uptime_formatted=format_uptime(uptime_secs),
        ollama=OllamaStatus(
            connected=connectivity["connected"],
            response_time_seconds=connectivity["response_time_seconds"],
            model_available=model_available,
            model_name=MODEL_NAME,
            error=error_message
        ),
        timestamp=datetime.utcnow().isoformat()
    )

    if is_healthy:
        return response
    else:
        raise HTTPException(status_code=503, detail=response.dict())


@app.post("/api/chat")
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
    api_key: str = Depends(verify_api_key)
):

    client_ip = request.client.host if request.client else "unknown"

    # Check rate limit
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {rate_limiter.max_requests} requests per minute. Try again later."
        )

    async def generate_stream() -> AsyncGenerator[str, None]:
        """Stream from Ollama"""
        # Prepare request
        payload = {
            "model": MODEL_NAME,
            "prompt": chat_request.message,
            "stream": True
        }

        # Add system prompt if provided
        if chat_request.system_prompt:
            payload["system"] = chat_request.system_prompt

        try:
            # Stream from Ollama
            async with http_client.stream(
                "POST",
                f"{OLLAMA_HOST}/api/generate",
                json=payload
            ) as response:
                response.raise_for_status()

                # Forward each chunk
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            chunk = json.loads(line)
                            if "response" in chunk:
                                token = chunk["response"]
                                yield f"data: {json.dumps({'token': token, 'done': chunk.get('done', False)})}\n\n"

                            if chunk.get("done", False):
                                yield f"data: {json.dumps({'done': True})}\n\n"
                                break
                        except json.JSONDecodeError:
                            continue

        except httpx.HTTPError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
