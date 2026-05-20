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

class UpdateGeminiKeyRequest(BaseModel):
    gemini_api_key: str

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
        "has_gemini_key": bool(user.gemini_api_key)
    }

@router.put("/gemini-key")
async def update_gemini_key(
    body: UpdateGeminiKeyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user.gemini_api_key = encrypt(body.gemini_api_key)
    await db.commit()
    return {"message": "Gemini API key saved securely"}

@router.get("/gemini-key")
async def get_gemini_key(user: User = Depends(get_current_user)):
    return {"has_key": bool(user.gemini_api_key)}

@router.delete("/gemini-key")
async def delete_gemini_key(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user.gemini_api_key = None
    await db.commit()
    return {"message": "Gemini API key removed"}
