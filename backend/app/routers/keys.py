import secrets
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.db.postgres import get_db
from app.db.models import APIKey, User
from app.services.auth import get_current_user

router = APIRouter(prefix="/keys", tags=["keys"])

class CreateKeyRequest(BaseModel):
    name: Optional[str] = "default"

@router.post("/create")
async def create_key(
    body: CreateKeyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    key = f"im-{secrets.token_urlsafe(24)}"
    api_key = APIKey(key=key, name=body.name, user_id=user.id)
    db.add(api_key)
    await db.commit()
    return {"key": key, "name": body.name}

@router.get("/list")
async def list_keys(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(APIKey)
        .where(APIKey.user_id == user.id, APIKey.is_active == True)
        .order_by(APIKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [{"id": str(k.id), "name": k.name, "key": k.key[:12] + "...", "created_at": k.created_at} for k in keys]
