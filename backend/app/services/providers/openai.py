import time
from openai import AsyncOpenAI
from app.services.providers.base import BaseProvider
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse

PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
}

class OpenAIProvider(BaseProvider):

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    @property
    def name(self) -> str:
        return "openai"

    async def complete(self, request: InferenceRequest) -> InferenceResponse:
        start = time.time()
        response = await self.client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            max_tokens=request.max_tokens
        )
        latency_ms = int((time.time() - start) * 1000)
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        return InferenceResponse(
            provider=self.name,
            model=request.model,
            content=response.choices[0].message.content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=self.estimate_cost(prompt_tokens, completion_tokens, request.model),
            latency_ms=latency_ms
        )

    async def stream(self, request: InferenceRequest):
        response = await self.client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            max_tokens=request.max_tokens,
            stream=True,
            stream_options={"include_usage": True}
        )
        prompt_tokens = 0
        completion_tokens = 0
        async for chunk in response:
            if chunk.usage:
                prompt_tokens = chunk.usage.prompt_tokens
                completion_tokens = chunk.usage.completion_tokens
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content, prompt_tokens, completion_tokens

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model: str = "gpt-4o-mini") -> float:
        pricing = PRICING.get(model, PRICING["gpt-4o-mini"])
        return round((prompt_tokens / 1_000_000) * pricing["input"] + (completion_tokens / 1_000_000) * pricing["output"], 6)
