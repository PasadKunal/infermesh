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
