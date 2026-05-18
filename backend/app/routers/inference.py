from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse
from app.services.providers.gemini import GeminiProvider
from app.services.cache import check_cache, store_cache
from app.db.postgres import get_db
from app.db.models import InferenceLog

router = APIRouter(prefix="/v1", tags=["inference"])
gemini_provider = GeminiProvider()

@router.post("/chat", response_model=InferenceResponse)
async def chat(
    request: InferenceRequest,
    db: AsyncSession = Depends(get_db)
):
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
