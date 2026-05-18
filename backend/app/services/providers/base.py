from abc import ABC, abstractmethod
from app.models.request import InferenceRequest
from app.models.response import InferenceResponse

class BaseProvider(ABC):

    @abstractmethod
    async def complete(self, request: InferenceRequest) -> InferenceResponse:
        pass

    @abstractmethod
    def estimate_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass
