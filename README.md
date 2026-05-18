# InferMesh

InferMesh is a self-hosted LLM inference gateway that sits between your app and LLM providers like Gemini, OpenAI, and Anthropic. It handles semantic caching, request logging, rate limiting, provider routing, and exposes a real-time metrics dashboard.

Think of it as a lightweight, self-hosted version of Helicone or LiteLLM.

## Live

- Dashboard: https://infermesh.vercel.app
- API: https://infermesh-production.up.railway.app
- API Docs: https://infermesh-production.up.railway.app/docs

## What it does

- **Semantic cache** — similar prompts return the same cached response instantly at $0 cost, using pgvector cosine similarity on Gemini embeddings
- **Request logging** — every request is logged with provider, model, tokens used, cost, latency, and cache hit status
- **Rate limiting** — Redis sliding window, 60 requests/min per API key
- **Metrics dashboard** — live React dashboard showing cost, latency percentiles, cache hit rate, and provider breakdown
- **Multi-provider ready** — abstract provider interface, adding OpenAI or Anthropic is one new file

## Stack

- **Backend** — FastAPI, PostgreSQL + pgvector, Redis, Alembic, SQLAlchemy
- **Frontend** — React, Vite, Recharts
- **Infra** — Docker, Railway, Vercel, GitHub Actions

## Running locally

**Prerequisites:** Python 3.11, Node 18+, Docker Desktop

```bash
git clone https://github.com/PasadKunal/infermesh
cd infermesh

# start postgres and redis
docker compose up -d

# backend
cd backend
python3.11 -m venv imvenv && source imvenv/bin/activate
pip install -r requirements.txt

# create .env
cp .env.example .env
# add your GEMINI_API_KEY to .env

# enable pgvector and run migrations
docker exec -it infermesh_postgres psql -U infermesh -d infermesh_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
alembic upgrade head

# start backend
uvicorn app.main:app --reload --port 8000

# frontend (new terminal)
cd frontend && npm install && npm run dev
```

Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`.

## Quick API test

```bash
# inference request
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What is the capital of France?"}], "model": "gemini-3.1-flash-lite-preview"}'

# send a similar question — should return cache_hit: true
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Which city is the capital of France?"}], "model": "gemini-3.1-flash-lite-preview"}'

# metrics
curl http://localhost:8000/metrics/summary
```

## Running tests

```bash
cd backend
pytest tests/ -v
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GEMINI_API_KEY` | Gemini API key from aistudio.google.com |
| `ENVIRONMENT` | `development` or `production` |
