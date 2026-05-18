# InferMesh

A production-grade LLM inference gateway and observability platform.

Routes requests across LLM providers with semantic caching, cost tracking,
provider fallback, rate limiting, and a real-time React dashboard.

## Live Demo
API: https://infermesh-production.up.railway.app/health
Docs: https://infermesh-production.up.railway.app/docs

## Stack
- **Backend**: FastAPI, PostgreSQL, pgvector, Redis, Celery
- **Frontend**: React, Vite, Recharts
- **Infra**: Docker, Railway, GitHub Actions CI

## Features
- Multi-provider LLM routing (Gemini, OpenAI, Anthropic)
- Semantic cache with pgvector cosine similarity — similar prompts return instantly at $0
- Per API key rate limiting (Redis sliding window)
- Full request logging — cost, latency, provider, cache hit
- Real-time metrics dashboard
- Automated CI with GitHub Actions

## Quick Start
```bash
# Clone and run locally
git clone https://github.com/PasadKunal/infermesh
cd infermesh
docker compose up -d
cd backend && source imvenv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## API Usage
```bash
curl -X POST https://infermesh-production.up.railway.app/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "model": "gemini-3.1-flash-lite-preview"}'
```
