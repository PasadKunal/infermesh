from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer
from typing import Optional
from app.db.postgres import get_db
from app.db.models import InferenceLog, User
from app.services.auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])

def filter_by_user(query, user):
    if user:
        return query.where(InferenceLog.user_id == user.id)
    return query

@router.get("/summary")
async def summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        filter_by_user(select(
            func.count(InferenceLog.id).label("total_requests"),
            func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("total_cost"),
            func.coalesce(func.avg(InferenceLog.latency_ms), 0).label("avg_latency_ms"),
            func.coalesce(func.sum(cast(InferenceLog.cache_hit, Integer)), 0).label("cache_hits")
        ), user)
    )
    row = result.one()
    total = row.total_requests or 1
    return {
        "total_requests": row.total_requests,
        "total_cost_usd": round(float(row.total_cost), 6),
        "avg_latency_ms": round(float(row.avg_latency_ms), 1),
        "cache_hit_rate": round((row.cache_hits / total) * 100, 1)
    }

@router.get("/cost-by-day")
async def cost_by_day(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        filter_by_user(select(
            func.date(InferenceLog.created_at).label("date"),
            func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("cost"),
            func.count(InferenceLog.id).label("requests")
        ).group_by(func.date(InferenceLog.created_at))
        .order_by(func.date(InferenceLog.created_at)), user)
    )
    return [{"date": str(r.date), "cost": round(float(r.cost), 6), "requests": r.requests} for r in result]

@router.get("/latency")
async def latency(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        filter_by_user(select(
            func.percentile_cont(0.50).within_group(InferenceLog.latency_ms).label("p50"),
            func.percentile_cont(0.95).within_group(InferenceLog.latency_ms).label("p95"),
            func.percentile_cont(0.99).within_group(InferenceLog.latency_ms).label("p99")
        ).where(InferenceLog.cache_hit == False), user)
    )
    row = result.one()
    return {
        "p50_ms": round(float(row.p50 or 0), 1),
        "p95_ms": round(float(row.p95 or 0), 1),
        "p99_ms": round(float(row.p99 or 0), 1)
    }

@router.get("/providers")
async def providers(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        filter_by_user(select(
            InferenceLog.provider,
            func.count(InferenceLog.id).label("requests"),
            func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("cost")
        ).group_by(InferenceLog.provider)
        .order_by(func.count(InferenceLog.id).desc()), user)
    )
    return [{"provider": r.provider, "requests": r.requests, "cost": round(float(r.cost), 6)} for r in result]

@router.get("/savings")
async def savings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        filter_by_user(
            select(
                func.count(InferenceLog.id).filter(InferenceLog.cache_hit == True).label("cache_hits"),
                func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("total_paid"),
                func.count(InferenceLog.id).label("total_requests")
            ), user
        )
    )
    row = result.one()
    avg_cost_result = await db.execute(
        filter_by_user(
            select(func.avg(InferenceLog.cost_usd))
            .where(InferenceLog.cache_hit == False)
            .where(InferenceLog.cost_usd > 0), user
        )
    )
    avg_cost = float(avg_cost_result.scalar() or 0.00002)
    estimated_saved = int(row.cache_hits) * avg_cost

    return {
        "total_requests": row.total_requests,
        "cache_hits": int(row.cache_hits),
        "total_paid_usd": round(float(row.total_paid), 6),
        "estimated_saved_usd": round(estimated_saved, 6),
        "total_without_cache_usd": round(float(row.total_paid) + estimated_saved, 6)
    }

@router.get("/history")
async def history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        filter_by_user(
            select(InferenceLog)
            .order_by(InferenceLog.created_at.desc())
            .limit(50), user
        )
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "prompt_text": l.prompt_text,
            "response_text": l.response_text,
            "provider": l.provider,
            "model": l.model,
            "latency_ms": l.latency_ms,
            "cost_usd": float(l.cost_usd or 0),
            "cache_hit": l.cache_hit,
            "created_at": l.created_at.isoformat()
        }
        for l in logs if l.prompt_text
    ]
@router.get("/rate-limit")
async def rate_limit_info(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    from app.db.models import APIKey
    result = await db.execute(
        select(APIKey)
        .where(APIKey.user_id == user.id, APIKey.is_active == True)
        .order_by(APIKey.created_at.desc())
        .limit(1)
    )
    key = result.scalar_one_or_none()
    if not key:
        return {"limit": 60, "remaining": 60, "key_name": None}

    import redis.asyncio as aioredis
    from app.core.config import settings
    r = await aioredis.from_url(settings.REDIS_URL)
    import time
    now = int(time.time())
    window_start = now - 60
    redis_key = f"rate_limit:{key.key}"
    count = await r.zcount(redis_key, window_start, now)
    await r.aclose()

    return {
        "limit": 60,
        "remaining": max(0, 60 - int(count)),
        "used": int(count),
        "key_name": key.name
    }
