import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse
from app.services.providers.gemini import GeminiProvider
from app.db.postgres import get_db
from app.db.models import InferenceLog

router = APIRouter(prefix="/v1", tags=["inference"])
gemini_provider = GeminiProvider()

@router.post("/chat", response_model=InferenceResponse)
async def chat(
    request: InferenceRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        response = await gemini_provider.complete(request)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Provider error: {str(e)}")

    log = InferenceLog(
        provider=response.provider,
        model=response.model,
        prompt_tokens=response.prompt_tokens,
        completion_tokens=response.completion_tokens,
        cost_usd=response.cost_usd,
        latency_ms=response.latency_ms,
        cache_hit=False,
        status_code=200
    )
    db.add(log)
    await db.commit()

    return response
