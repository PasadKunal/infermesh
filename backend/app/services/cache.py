import asyncio
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.models import PromptCache
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def get_threshold(prompt: str) -> float:
    """
    Adaptive threshold based on prompt type.
    Short factual questions need higher similarity to avoid wrong cached answers.
    Broad descriptive questions can match more loosely.
    """
    prompt_lower = prompt.lower().strip()
    word_count = len(prompt_lower.split())

    # Very short factual questions — strict matching
    # e.g. "What is X?", "Who is X?", "When did X happen?"
    if word_count <= 6 and any(prompt_lower.startswith(w) for w in [
        "what is", "who is", "when did", "where is", "how many",
        "what are", "which is", "what was", "who was"
    ]):
        return 0.88

    # Medium questions — balanced
    # e.g. "What is the capital of France?"
    if word_count <= 12:
        return 0.82

    # Long descriptive prompts — loose matching
    # e.g. "Tell me about Python programming language and its use cases"
    return 0.72

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
    threshold = get_threshold(prompt)

    result = await db.execute(
        select(PromptCache)
        .order_by(PromptCache.prompt_embedding.cosine_distance(embedding))
        .limit(1)
    )
    cached = result.scalar_one_or_none()

    if cached is None:
        return None

    distance = float(
        (await db.execute(
            select(PromptCache.prompt_embedding.cosine_distance(embedding))
            .where(PromptCache.id == cached.id)
        )).scalar()
    )
    similarity = 1 - distance

    if similarity >= threshold:
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
