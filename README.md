<p align="center">
  <img src="frontend/src/assets/ailo-logo.png" alt="Ailo Logo" width="200" />
</p>

# Ailo

Ailo is a lightweight AI chatbot with a clean, distraction-free interface. It streams responses token by token from a locally hosted LLM, so nothing leaves your machine. No login, no account, no data stored between sessions.

Built as a team project. The frontend is a React + Vite single-page app; the backend is a FastAPI server that bridges the chat interface to an Ollama instance running on the local network.

---

## Project Structure

```
Ailo/
├── backend/    # FastAPI server, Ollama integration, API key auth, rate limiting
└── frontend/   # React + Vite chat UI with SSE streaming support
```

---

## My Contribution — Backend

My responsibility on this project was the backend. I built the FastAPI server that sits between the frontend and a locally self-hosted LLM running through [Ollama](https://ollama.com). The model ran on my home machine and was exposed to the rest of the team for development and testing throughout the project.

What I built:

- Streaming chat endpoint using Server-Sent Events (SSE), forwarding tokens from Ollama as they generate
- API key authentication so only the frontend could hit the endpoint
- Rate limiting per client IP (20 requests/minute by default)
- Health check endpoints (`/health/live`, `/health/ready`, `/health`) for monitoring connectivity to Ollama and the loaded model
- Environment-based configuration via `.env` for easy deployment to different machines

The backend connects to any Ollama instance — local or remote — just by changing `OLLAMA_HOST` in the `.env` file. The model I ran was `gemma3:4b-it-qat`.

---

## Tech Stack

**Frontend**
- React 18
- Vite
- React Router

**Backend**
- FastAPI
- Ollama (local LLM inference)
- httpx (async HTTP client)
- Pydantic

---

## Running Locally

### Backend

Requires Python 3.11+ and an Ollama instance running with the model pulled.

```bash
cd backend

# Pull the model if you haven't already
ollama pull gemma3:4b-it-qat

# Run the setup script or install manually
chmod +x setup.sh && ./setup.sh

# Copy and edit the env file
cp .env.example .env

# Start the server
source venv/bin/activate
python app.py
```

The server starts at `http://localhost:8000`.

### Frontend

Requires Node.js.

```bash
cd frontend
npm install

# Copy and edit the env file
cp .env.example .env

npm run dev
```

Open the local URL shown in the terminal.

---

## Environment Variables

**backend/.env**

| Variable | Description | Default |
|---|---|---|
| `OLLAMA_HOST` | URL of your Ollama instance | `http://localhost:11434` |
| `MODEL_NAME` | Model to use | `gemma3:4b-it-qat` |
| `API_KEY` | Secret key checked on every request | _(none)_ |
| `CORS_ORIGINS` | Allowed origins, comma-separated | `*` |
| `RATE_LIMIT` | Max requests per minute | `20/minute` |

**frontend/.env**

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Base URL of the backend API |
| `VITE_API_KEY` | Matches the backend `API_KEY` |
