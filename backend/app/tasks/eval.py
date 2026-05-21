import asyncio
from app.celery_app import celery
from google import genai
from app.core.config import settings

EVAL_PROMPT = """You are an LLM response evaluator. Score the following response on a scale of 1-10.

Prompt: {prompt}
Response: {response}

Score on these dimensions:
- Relevance: Does the response directly address the prompt?
- Coherence: Is the response well-structured and clear?
- Completeness: Does the response fully answer the prompt?

Reply with ONLY a JSON object like this:
{{"relevance": 8, "coherence": 9, "completeness": 7, "overall": 8, "reasoning": "one sentence"}}"""

@celery.task(name="eval.score_response", bind=True, max_retries=2)
def score_response(self, log_id: str, prompt: str, response: str):
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        result = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=EVAL_PROMPT.format(prompt=prompt, response=response[:2000])
        )

        import json
        import re
        text = result.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            return {"error": "Could not parse score"}

        scores = json.loads(match.group())

        import psycopg2
        from urllib.parse import urlparse

        db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(
            "UPDATE inference_logs SET eval_score = %s, eval_data = %s WHERE id = %s",
            (scores.get("overall"), json.dumps(scores), log_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return scores

    except Exception as e:
        raise self.retry(exc=e, countdown=5)
