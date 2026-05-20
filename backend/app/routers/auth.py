from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.postgres import get_db
from app.db.models import User
from app.services.auth import hash_password, verify_password, create_token, get_current_user
from app.services.encryption import encrypt, decrypt

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateKeyRequest(BaseModel):
    api_key: str

@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_token(str(user.id))
    return {"token": token, "email": user.email, "name": user.name}

@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(user.id))
    return {"token": token, "email": user.email, "name": user.name}

@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "has_gemini_key": bool(user.gemini_api_key),
        "has_openai_key": bool(user.openai_api_key),
        "has_anthropic_key": bool(user.anthropic_api_key),
    }

def _save_key(field: str):
    async def endpoint(
        body: UpdateKeyRequest,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user)
    ):
        setattr(user, field, encrypt(body.api_key))
        await db.commit()
        return {"message": f"Key saved securely"}
    return endpoint

def _get_key(field: str):
    async def endpoint(user: User = Depends(get_current_user)):
        return {"has_key": bool(getattr(user, field))}
    return endpoint

def _delete_key(field: str):
    async def endpoint(
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user)
    ):
        setattr(user, field, None)
        await db.commit()
        return {"message": "Key removed"}
    return endpoint

router.put("/gemini-key")(_save_key("gemini_api_key"))
router.get("/gemini-key")(_get_key("gemini_api_key"))
router.delete("/gemini-key")(_delete_key("gemini_api_key"))

router.put("/openai-key")(_save_key("openai_api_key"))
router.get("/openai-key")(_get_key("openai_api_key"))
router.delete("/openai-key")(_delete_key("openai_api_key"))

router.put("/anthropic-key")(_save_key("anthropic_api_key"))
router.get("/anthropic-key")(_get_key("anthropic_api_key"))
router.delete("/anthropic-key")(_delete_key("anthropic_api_key"))
