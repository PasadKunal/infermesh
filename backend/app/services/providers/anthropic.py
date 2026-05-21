import time
import anthropic as anthropic_sdk
from app.services.providers.base import BaseProvider
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse

PRICING = {
    "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
    "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
    "claude-3-opus-20240229": {"input": 15.00, "output": 75.00},
    "claude-opus-4-5": {"input": 15.00, "output": 75.00},
    "claude-sonnet-4-5": {"input": 3.00, "output": 15.00},
}

class AnthropicProvider(BaseProvider):

    def __init__(self, api_key: str):
        self.client = anthropic_sdk.AsyncAnthropic(api_key=api_key)

    @property
    def name(self) -> str:
        return "anthropic"

    async def complete(self, request: InferenceRequest) -> InferenceResponse:
        start = time.time()
        system_msg = next((m.content for m in request.messages if m.role == "system"), None)
        messages = [{"role": m.role, "content": m.content} for m in request.messages if m.role != "system"]
        kwargs = {"model": request.model, "max_tokens": request.max_tokens, "messages": messages}
        if system_msg:
            kwargs["system"] = system_msg
        response = await self.client.messages.create(**kwargs)
        latency_ms = int((time.time() - start) * 1000)
        prompt_tokens = response.usage.input_tokens
        completion_tokens = response.usage.output_tokens
        return InferenceResponse(
            provider=self.name,
            model=request.model,
            content=response.content[0].text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=self.estimate_cost(prompt_tokens, completion_tokens, request.model),
            latency_ms=latency_ms
        )

    async def stream(self, request: InferenceRequest):
        system_msg = next((m.content for m in request.messages if m.role == "system"), None)
        messages = [{"role": m.role, "content": m.content} for m in request.messages if m.role != "system"]
        kwargs = {"model": request.model, "max_tokens": request.max_tokens, "messages": messages}
        if system_msg:
            kwargs["system"] = system_msg
        prompt_tokens = 0
        completion_tokens = 0
        async with self.client.messages.stream(**kwargs) as stream:
            async for event in stream:
                if hasattr(event, 'type'):
                    if event.type == 'message_start':
                        prompt_tokens = event.message.usage.input_tokens
                    elif event.type == 'message_delta':
                        completion_tokens = event.usage.output_tokens
                    elif event.type == 'content_block_delta':
                        if hasattr(event.delta, 'text'):
                            yield event.delta.text, prompt_tokens, completion_tokens

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model: str = "claude-3-5-haiku-20241022") -> float:
        pricing = PRICING.get(model, PRICING["claude-3-5-haiku-20241022"])
        return round((prompt_tokens / 1_000_000) * pricing["input"] + (completion_tokens / 1_000_000) * pricing["output"], 6)
