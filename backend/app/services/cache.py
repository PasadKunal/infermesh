import asyncio
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.models import PromptCache
from app.core.config import settings

SIMILARITY_THRESHOLD = 0.82

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def get_embedding(text: str) -> list[float]:
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.embed_content(
            model="gemini-embedding-001",
            contents=text
        )
    )
    return response.embeddings[0].values

async def check_cache(prompt: str, db: AsyncSession) -> str | None:
    embedding = await get_embedding(prompt)

    result = await db.execute(
        select(PromptCache)
        .order_by(PromptCache.prompt_embedding.cosine_distance(embedding))
        .limit(1)
    )
    cached = result.scalar_one_or_none()

    if cached is None:
        print("CACHE: no entries found")
        return None

    distance_result = await db.execute(
        select(PromptCache.prompt_embedding.cosine_distance(embedding))
        .where(PromptCache.id == cached.id)
    )
    distance = float(distance_result.scalar())
    similarity = 1 - distance
    print(f"CACHE: similarity={similarity:.4f} threshold={SIMILARITY_THRESHOLD} prompt='{prompt[:50]}'")

    if similarity >= SIMILARITY_THRESHOLD:
        await db.execute(
            update(PromptCache)
            .where(PromptCache.id == cached.id)
            .values(hit_count=PromptCache.hit_count + 1)
        )
        await db.commit()
        return cached.response_text

    return None

async def store_cache(prompt: str, response: str, model: str, db: AsyncSession):
    embedding = await get_embedding(prompt)
    entry = PromptCache(
        prompt_embedding=embedding,
        prompt_text=prompt,
        response_text=response,
        model=model
    )
    db.add(entry)
    await db.commit()
    print(f"CACHE: stored prompt='{prompt[:50]}'")
