from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse
from app.services.providers.gemini import GeminiProvider
from app.services.cache import check_cache, store_cache
from app.services.rate_limiter import check_rate_limit
from app.db.postgres import get_db
from app.db.models import InferenceLog
from app.core.config import settings

router = APIRouter(prefix="/v1", tags=["inference"])
gemini_provider = GeminiProvider()

@router.post("/chat", response_model=InferenceResponse)
async def chat(
    request: InferenceRequest,
    db: AsyncSession = Depends(get_db),
    x_api_key: Optional[str] = Header(None)
):
    api_key = x_api_key or settings.DEFAULT_API_KEY

    is_allowed, remaining = await check_rate_limit(api_key)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Max 60 requests per minute.",
            headers={"X-RateLimit-Remaining": "0"}
        )

    user_message = next(
        (m.content for m in reversed(request.messages) if m.role == "user"),
        None
    )

    cached_response = await check_cache(user_message, db)
    if cached_response:
        log = InferenceLog(
            provider="cache",
            model=request.model,
            cache_hit=True,
            cost_usd=0.0,
            latency_ms=0,
            status_code=200
        )
        db.add(log)
        await db.commit()

        return InferenceResponse(
            provider="cache",
            model=request.model,
            content=cached_response,
            prompt_tokens=0,
            completion_tokens=0,
            cost_usd=0.0,
            latency_ms=0,
            cache_hit=True
        )

    try:
        response = await gemini_provider.complete(request)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Provider error: {str(e)}")

    await store_cache(user_message, response.content, request.model, db)

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
