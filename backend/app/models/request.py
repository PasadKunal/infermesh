from pydantic import BaseModel
from typing import Optional

class Message(BaseModel):
    role: str
    content: str

class InferenceRequest(BaseModel):
    messages: list[Message]
    model: str = "gemini-2.0-flash"
    provider: Optional[str] = None
    max_tokens: int = 1000
