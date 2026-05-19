# InferMesh

A self-hosted LLM inference gateway with semantic caching, cost tracking, rate limiting, and a real-time metrics dashboard.

Think of it as a lightweight self-hosted version of Helicone or LiteLLM.

## Live Demo

- Dashboard: https://infermesh.vercel.app
- API: https://infermesh-production.up.railway.app
- API Docs: https://infermesh-production.up.railway.app/docs

## What it does

- **Semantic cache** — similar prompts return cached responses instantly at $0 cost using pgvector cosine similarity
- **Request logging** — every request logged with provider, model, tokens, cost, latency, and cache hit status
- **Rate limiting** — Redis sliding window, 60 requests/min per API key
- **Metrics dashboard** — live React dashboard showing cost, latency percentiles, cache hit rate, and provider breakdown
- **Multi-provider ready** — abstract provider interface, adding OpenAI or Anthropic is one new file

## Stack

- **Backend** — FastAPI, PostgreSQL + pgvector, Redis, Alembic, SQLAlchemy
- **Frontend** — React, Vite, Recharts
- **Infra** — Docker, Railway, Vercel, GitHub Actions

## Running locally

**Prerequisites:** Docker Desktop, a Gemini API key (free at aistudio.google.com)

```bash
# 1. Clone the repo
git clone https://github.com/PasadKunal/infermesh
cd infermesh

# 2. Set up environment variables
cp backend/.env.example backend/.env
# Open backend/.env and add your GEMINI_API_KEY

# 3. Start everything
docker compose up --build
```

That's it. Three commands.

- Backend: http://localhost:8000
- Frontend dashboard: http://localhost:5173
- API docs: http://localhost:8000/docs

## API Usage

```bash
# Send an inference request
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What is the capital of France?"}], "model": "gemini-3.1-flash-lite-preview"}'

# Send a similar question — returns cache_hit: true instantly
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Which city is the capital of France?"}], "model": "gemini-3.1-flash-lite-preview"}'

# Check metrics
curl http://localhost:8000/metrics/summary
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GEMINI_API_KEY` | Get free at aistudio.google.com |
| `ENVIRONMENT` | `development` or `production` |

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## How semantic caching works

Every prompt is converted to a 3072-dimensional vector using Gemini embeddings. On each request the gateway finds the closest matching vector in the cache using cosine similarity. If similarity is above 0.82 the cached response is returned — meaning "What is ML?" and "Explain machine learning" both hit the same cache entry.

## CI/CD

GitHub Actions runs on every push — spins up Postgres and Redis, runs migrations, runs the full test suite. Railway auto-deploys the backend and Vercel auto-deploys the frontend on every push to main.
