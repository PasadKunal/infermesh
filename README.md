# InferMesh

A self-hosted LLM inference gateway with semantic caching, cost tracking, rate limiting, and a real-time metrics dashboard. Each user brings their own Gemini API key and gets an isolated dashboard showing their own usage.

## Live Demo

- Dashboard: https://infermesh.vercel.app
- API: https://infermesh-production.up.railway.app
- API Docs: https://infermesh-production.up.railway.app/docs

## What it does

- **Semantic cache** - similar prompts return cached responses instantly at $0 cost using pgvector cosine similarity with adaptive thresholds based on prompt type
- **Per-user isolation** - each user brings their own Gemini API key, stored encrypted. They pay their own Gemini bill and see only their own metrics
- **Request logging** - every request logged with provider, model, tokens, cost, latency, and cache hit status
- **Rate limiting** - Redis sliding window, 60 requests per minute per API key
- **Metrics dashboard** - live React dashboard showing cost, latency percentiles, cache hit rate, and provider breakdown
- **Playground** - built-in chat interface to test prompts and watch the cache in action
- **Multi-provider ready** - abstract provider interface, adding OpenAI or Anthropic is one new file

## Stack

- **Backend** - FastAPI, PostgreSQL + pgvector, Redis, Alembic, SQLAlchemy
- **Frontend** - React, Vite, Recharts, React Router
- **Infra** - Docker, Railway, Vercel, GitHub Actions

## How it works

```txt
User registers at infermesh.vercel.app
        |
        +-- Adds their Gemini API key in Settings (stored encrypted)
        +-- Creates an InferMesh API key (im-...)
        |
        v
App sends request with x-api-key: im-...
        |
        v
InferMesh Gateway
        |
        +-- Check semantic cache (pgvector cosine similarity)
        |       Cache hit  -> return instantly, $0 cost
        |       Cache miss -> call user's Gemini key
        |
        +-- Log request to user's account
        +-- Return response
        |
        v
User dashboard shows their usage, cost, cache hit rate
```

## Getting started (new user)

1. Register at https://infermesh.vercel.app/register
2. Go to Settings, add your Gemini API key (free at aistudio.google.com)
3. Create an InferMesh API key
4. Send requests through the gateway:

```bash
curl -X POST https://infermesh-production.up.railway.app/v1/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: im-your-key-here" \
  -d '{
    "messages": [{"role": "user", "content": "What is Docker?"}],
    "model": "gemini-3.1-flash-lite-preview"
  }'
```

5. Visit your dashboard to see metrics
6. Or use the Playground at https://infermesh.vercel.app/playground to test interactively

## Running locally

**Prerequisites:** Docker Desktop, Python 3.11, Node 18+, a Gemini API key

```bash
git clone https://github.com/PasadKunal/infermesh
cd infermesh

docker compose up -d

cd backend
python3.11 -m venv imvenv && source imvenv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Add your GEMINI_API_KEY and ENCRYPTION_KEY to .env
# Generate ENCRYPTION_KEY: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

alembic upgrade head
uvicorn app.main:app --reload --port 8000

# New terminal
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GEMINI_API_KEY` | Your Gemini key, used only for generating embeddings |
| `ENCRYPTION_KEY` | Fernet key for encrypting user Gemini keys at rest |
| `SECRET_KEY` | JWT signing secret |
| `ENVIRONMENT` | `development` or `production` |

## Security

User Gemini API keys are encrypted using Fernet symmetric encryption before being stored in the database. The encryption key lives only in environment variables and is never stored in the database or committed to the repository. Even with full database access, the stored keys are unreadable without the encryption key.

## How semantic caching works

Every prompt is converted to a 3072-dimensional vector using Gemini embeddings. On each request the gateway finds the closest matching vector in the shared cache using cosine similarity. The similarity threshold adapts based on prompt type:

- Short factual questions (under 6 words): threshold 0.88
- Medium questions (under 12 words): threshold 0.82
- Long descriptive prompts: threshold 0.72

The cache is shared across all users, so the more users on the platform, the higher the cache hit rate for everyone.

## Running tests

```bash
cd backend
source imvenv/bin/activate
pytest tests/ -v
```

## CI/CD

GitHub Actions runs on every push. It spins up Postgres and Redis, enables the pgvector extension, runs Alembic migrations, and runs the full pytest suite. Railway auto-deploys the backend and Vercel auto-deploys the frontend on every push to main.