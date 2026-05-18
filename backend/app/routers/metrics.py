from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer
from app.db.postgres import get_db
from app.db.models import InferenceLog

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.count(InferenceLog.id).label("total_requests"),
            func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("total_cost"),
            func.coalesce(func.avg(InferenceLog.latency_ms), 0).label("avg_latency_ms"),
            func.coalesce(
                func.sum(cast(InferenceLog.cache_hit, Integer)), 0
            ).label("cache_hits")
        )
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
async def cost_by_day(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.date(InferenceLog.created_at).label("date"),
            func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("cost"),
            func.count(InferenceLog.id).label("requests")
        )
        .group_by(func.date(InferenceLog.created_at))
        .order_by(func.date(InferenceLog.created_at))
    )
    return [
        {
            "date": str(r.date),
            "cost": round(float(r.cost), 6),
            "requests": r.requests
        }
        for r in result
    ]

@router.get("/latency")
async def latency(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.percentile_cont(0.50).within_group(
                InferenceLog.latency_ms
            ).label("p50"),
            func.percentile_cont(0.95).within_group(
                InferenceLog.latency_ms
            ).label("p95"),
            func.percentile_cont(0.99).within_group(
                InferenceLog.latency_ms
            ).label("p99")
        )
        .where(InferenceLog.cache_hit == False)
    )
    row = result.one()
    return {
        "p50_ms": round(float(row.p50 or 0), 1),
        "p95_ms": round(float(row.p95 or 0), 1),
        "p99_ms": round(float(row.p99 or 0), 1)
    }

@router.get("/providers")
async def providers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            InferenceLog.provider,
            func.count(InferenceLog.id).label("requests"),
            func.coalesce(func.sum(InferenceLog.cost_usd), 0).label("cost")
        )
        .group_by(InferenceLog.provider)
        .order_by(func.count(InferenceLog.id).desc())
    )
    return [
        {
            "provider": r.provider,
            "requests": r.requests,
            "cost": round(float(r.cost), 6)
        }
        for r in result
    ]
