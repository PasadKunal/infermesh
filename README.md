# InferMesh

A self-hosted LLM inference gateway with semantic caching, multi-provider routing, streaming responses, async quality evaluation, and a real-time metrics dashboard. Each user brings their own provider API keys, stored encrypted, and gets a fully isolated dashboard.

## Live Demo

- Dashboard: https://infermesh.vercel.app
- API: https://infermesh-production.up.railway.app
- API Docs: https://infermesh-production.up.railway.app/docs

## Features

- **Semantic cache** - similar prompts return cached responses instantly at $0 cost using pgvector cosine similarity with adaptive thresholds
- **Multi-provider routing** - supports Gemini, OpenAI, and Anthropic. Routes to cheapest available provider automatically. Override with `x-provider` header
- **Streaming responses** - tokens stream to the client via SSE as they are generated, with accurate cost tracking
- **Async eval worker** - Celery background worker scores each response for quality (relevance, coherence, completeness) using a secondary LLM call
- **Per-user isolation** - each user brings their own provider keys, stored encrypted with Fernet. They pay their own bills
- **Email verification** - Gmail SMTP verification on registration. Login blocked until verified
- **Rate limiting** - Redis sliding window, 60 requests per minute per API key
- **Request history** - last 50 requests with prompt, response, cost, latency, cache status, and eval score
- **Real-time dashboard** - cost over time, latency percentiles, provider breakdown, cache hit rate, rate limit usage

## Architecture

```txt
Client
  |
  | POST /v1/chat/stream  (x-api-key: im-...)
  v
FastAPI Gateway
  |
  +-- Auth: look up user from InferMesh key
  +-- Rate limit: Redis sliding window
  +-- Cache check: pgvector cosine similarity
  |     Hit  -> stream cached response at $0
  |     Miss -> route to cheapest available provider
  |
  +-- Stream response via SSE
  +-- Log request (prompt, response, tokens, cost)
  +-- Queue Celery eval task
  |
  v
Redis (broker)
  |
  v
Celery Worker (background)
  |
  +-- Score response quality 1-10
  +-- Save score to inference_logs
```

## Stack

- **Backend** - FastAPI, PostgreSQL + pgvector, Redis, Alembic, SQLAlchemy, Celery
- **Frontend** - React, Vite, Recharts, React Router, react-markdown
- **Providers** - Gemini (google-genai), OpenAI, Anthropic
- **Infra** - Docker, Vercel, GitHub

## Getting started (new user)

1. Register at https://infermesh.vercel.app/register
2. Verify your email
3. Go to Settings, add at least one provider API key
4. Create an InferMesh API key
5. Send requests:

```bash
curl -X POST https://infermesh-production.up.railway.app/v1/chat/stream \
  -H "Content-Type: application/json" \
  -H "x-api-key: im-your-key-here" \
  -d '{
    "messages": [{"role": "user", "content": "What is Docker?"}],
    "model": "gemini-3.1-flash-lite-preview"
  }'
```

Or use the Playground at https://infermesh.vercel.app/playground

## Running locally

**Prerequisites:** Docker Desktop, Python 3.11, Node 18+

```bash
git clone https://github.com/PasadKunal/infermesh
cd infermesh

docker compose up -d postgres redis

cd backend
python3.11 -m venv imvenv && source imvenv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in: GEMINI_API_KEY, ENCRYPTION_KEY, SECRET_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
# Generate ENCRYPTION_KEY: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

alembic upgrade head
uvicorn app.main:app --reload --port 8000

# New terminal - Celery worker
cd backend && source imvenv/bin/activate
celery -A app.celery_app.celery worker --loglevel=info

# New terminal - Frontend
cd frontend && npm install && npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GEMINI_API_KEY` | Gemini key for embeddings only |
| `ENCRYPTION_KEY` | Fernet key for encrypting user provider keys |
| `SECRET_KEY` | JWT signing secret |
| `GMAIL_USER` | Gmail address for sending verification emails |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `FRONTEND_URL` | Frontend URL for email links |
| `ENVIRONMENT` | `development` or `production` |

## API reference

```bash
POST /auth/register          - Register (sends verification email)
POST /auth/login             - Login (requires verified email)
GET  /auth/verify-email      - Verify email token
POST /auth/resend-verification - Resend verification email
PUT  /auth/gemini-key        - Save encrypted Gemini key
PUT  /auth/openai-key        - Save encrypted OpenAI key
PUT  /auth/anthropic-key     - Save encrypted Anthropic key

POST /keys/create            - Create InferMesh API key
GET  /keys/list              - List API keys
DELETE /keys/{id}            - Delete API key

POST /v1/chat                - Inference (blocking)
POST /v1/chat/stream         - Inference (streaming SSE)

GET /metrics/summary         - Total requests, cost, latency, cache hit rate
GET /metrics/cost-by-day     - Daily cost breakdown
GET /metrics/latency         - p50, p95, p99 latency
GET /metrics/providers       - Requests and cost by provider
GET /metrics/savings         - All-time cache savings
GET /metrics/history         - Last 50 requests with eval scores
GET /metrics/rate-limit      - Current rate limit status
```

## How semantic caching works

Every prompt is embedded into a 3072-dimensional vector using Gemini embeddings. On each request the gateway finds the closest matching vector using cosine similarity. Thresholds adapt by prompt type:

- Short factual (under 6 words): 0.88
- Medium (under 12 words): 0.82
- Long descriptive: 0.72

Cache is shared across users — higher user count means higher hit rate for everyone.

## How the eval worker works

After each non-cached inference response, a Celery task is queued in Redis. The worker picks it up asynchronously and sends the prompt and response to a secondary Gemini call with an evaluation rubric. It scores relevance, coherence, and completeness on a 1-10 scale and saves the result back to the inference log. Scores appear in the History page.
