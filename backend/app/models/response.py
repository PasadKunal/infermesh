from pydantic import BaseModel
import uuid

class InferenceResponse(BaseModel):
    id: str = str(uuid.uuid4())
    provider: str
    model: str
    content: str
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    latency_ms: int
    cache_hit: bool = False
