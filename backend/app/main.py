from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import inference, metrics
from app.core.config import settings

app = FastAPI(
    title="InferMesh",
    description="LLM Inference Gateway",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(inference.router)
app.include_router(metrics.router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT
    }
