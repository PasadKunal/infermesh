import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.postgres import get_db
from app.db.models import User
from app.services.auth import hash_password, verify_password, create_token, get_current_user
from app.services.encryption import encrypt, decrypt
from app.services.email import send_verification_email

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

    verification_token = secrets.token_urlsafe(32)
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        is_verified=False,
        verification_token=verification_token
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    send_verification_email(body.email, body.name or body.email, verification_token)

    token = create_token(str(user.id))
    return {
        "token": token,
        "email": user.email,
        "name": user.name,
        "is_verified": False,
        "message": "Check your email to verify your account"
    }

@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")
    token = create_token(str(user.id))
    return {
        "token": token,
        "email": user.email,
        "name": user.name,
        "is_verified": user.is_verified
    }

@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    return {"message": "Email verified successfully"}

@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "is_verified": user.is_verified,
        "has_gemini_key": bool(user.gemini_api_key),
        "has_openai_key": bool(user.openai_api_key),
        "has_anthropic_key": bool(user.anthropic_api_key),
    }

@router.post("/resend-verification")
async def resend_verification(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.is_verified:
        return {"message": "Already verified"}
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    await db.commit()
    send_verification_email(user.email, user.name or user.email, token)
    return {"message": "Verification email sent"}

def _save_key(field: str):
    async def endpoint(
        body: UpdateKeyRequest,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user)
    ):
        setattr(user, field, encrypt(body.api_key))
        await db.commit()
        return {"message": "Key saved securely"}
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
