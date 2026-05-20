import time
from google import genai
from google.genai import types
from app.services.providers.base import BaseProvider
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse

PRICING = {
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "gemini-2.0-flash-lite": {"input": 0.075, "output": 0.30},
    "gemini-3.1-flash-lite-preview": {"input": 0.075, "output": 0.30},
}

class GeminiProvider(BaseProvider):

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    @property
    def name(self) -> str:
        return "gemini"

    async def complete(self, request: InferenceRequest) -> InferenceResponse:
        start = time.time()

        contents = [
            types.Content(
                role="user" if m.role == "user" else "model",
                parts=[types.Part(text=m.content)]
            )
            for m in request.messages
        ]

        response = self.client.models.generate_content(
            model=request.model,
            contents=contents,
            config=types.GenerateContentConfig(
                max_output_tokens=request.max_tokens
            )
        )

        latency_ms = int((time.time() - start) * 1000)
        prompt_tokens = response.usage_metadata.prompt_token_count or 0
        completion_tokens = response.usage_metadata.candidates_token_count or 0

        return InferenceResponse(
            provider=self.name,
            model=request.model,
            content=response.text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=self.estimate_cost(prompt_tokens, completion_tokens, request.model),
            latency_ms=latency_ms
        )

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int, model: str = "gemini-2.0-flash") -> float:
        pricing = PRICING.get(model, PRICING["gemini-2.0-flash"])
        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * pricing["output"]
        return round(input_cost + output_cost, 6)
