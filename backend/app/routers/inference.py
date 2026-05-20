from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse
from app.services.providers.gemini import GeminiProvider
from app.services.providers.openai import OpenAIProvider
from app.services.providers.anthropic import AnthropicProvider
from app.services.cache import check_cache, store_cache
from app.services.rate_limiter import check_rate_limit
from app.services.auth import get_user_from_api_key
from app.services.encryption import decrypt
from app.db.postgres import get_db
from app.db.models import InferenceLog, APIKey

router = APIRouter(prefix="/v1", tags=["inference"])

PROVIDER_COST_RANK = ["gemini", "openai", "anthropic"]

def get_provider(user, model: str, preferred: Optional[str] = None):
    available = []

    if user.gemini_api_key:
        available.append(("gemini", GeminiProvider(api_key=decrypt(user.gemini_api_key))))
    if user.openai_api_key:
        available.append(("openai", OpenAIProvider(api_key=decrypt(user.openai_api_key))))
    if user.anthropic_api_key:
        available.append(("anthropic", AnthropicProvider(api_key=decrypt(user.anthropic_api_key))))

    if not available:
        return None, None

    if preferred:
        for name, provider in available:
            if name == preferred:
                return name, provider

    for cost_provider in PROVIDER_COST_RANK:
        for name, provider in available:
            if name == cost_provider:
                return name, provider

    return available[0]

@router.post("/chat", response_model=InferenceResponse)
async def chat(
    request: InferenceRequest,
    db: AsyncSession = Depends(get_db),
    x_api_key: Optional[str] = Header(None),
    x_provider: Optional[str] = Header(None)
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")

    is_allowed, _ = await check_rate_limit(x_api_key)
    if not is_allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    user = await get_user_from_api_key(x_api_key, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")

    provider_name, provider = get_provider(user, request.model, x_provider)
    if not provider:
        raise HTTPException(status_code=400, detail="No provider API keys configured. Add one in Settings.")

    result = await db.execute(select(APIKey).where(APIKey.key == x_api_key))
    api_key_record = result.scalar_one_or_none()

    user_message = next(
        (m.content for m in reversed(request.messages) if m.role == "user"), None
    )

    cached_response = await check_cache(user_message, db)
    if cached_response:
        log = InferenceLog(
            user_id=user.id,
            api_key_id=api_key_record.id if api_key_record else None,
            provider="cache",
            model=request.model,
            prompt_text=user_message,
            response_text=cached_response,
            cache_hit=True,
            cost_usd=0.0,
            latency_ms=0,
            status_code=200
        )
        db.add(log)
        await db.commit()
        return InferenceResponse(
            provider="cache", model=request.model, content=cached_response,
            prompt_tokens=0, completion_tokens=0, cost_usd=0.0, latency_ms=0, cache_hit=True
        )

    try:
        response = await provider.complete(request)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Provider error: {str(e)}")

    await store_cache(user_message, response.content, request.model, db)

    log = InferenceLog(
        user_id=user.id,
        api_key_id=api_key_record.id if api_key_record else None,
        provider=response.provider,
        model=response.model,
        prompt_text=user_message,
        response_text=response.content,
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
