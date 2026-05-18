from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_chat_returns_response():
    mock_response = type("R", (), {
        "id": "test-id",
        "provider": "gemini",
        "model": "gemini-3.1-flash-lite-preview",
        "content": "Four",
        "prompt_tokens": 10,
        "completion_tokens": 1,
        "cost_usd": 0.000002,
        "latency_ms": 500,
        "cache_hit": False
    })()

    with patch("app.routers.inference.check_cache", new_callable=AsyncMock, return_value=None), \
         patch("app.routers.inference.gemini_provider.complete", new_callable=AsyncMock, return_value=mock_response), \
         patch("app.routers.inference.store_cache", new_callable=AsyncMock), \
         patch("app.routers.inference.check_rate_limit", new_callable=AsyncMock, return_value=(True, 59)):

        response = client.post("/v1/chat", json={
            "messages": [{"role": "user", "content": "What is 2+2?"}],
            "model": "gemini-3.1-flash-lite-preview"
        })

        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "cost_usd" in data
        assert "cache_hit" in data

def test_chat_rate_limit():
    with patch("app.routers.inference.check_rate_limit", new_callable=AsyncMock, return_value=(False, 0)):
        response = client.post("/v1/chat", json={
            "messages": [{"role": "user", "content": "hi"}],
            "model": "gemini-3.1-flash-lite-preview"
        })
        assert response.status_code == 429

def test_metrics_summary():
    mock_row = MagicMock()
    mock_row.total_requests = 10
    mock_row.total_cost = 0.000014
    mock_row.avg_latency_ms = 500.0
    mock_row.cache_hits = 5

    mock_result = MagicMock()
    mock_result.one.return_value = mock_row

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    with patch("app.routers.metrics.get_db", return_value=mock_db):
        with patch("app.db.postgres.AsyncSessionLocal") as mock_session:
            mock_session.return_value.__aenter__.return_value = mock_db
            response = client.get("/metrics/summary")
            assert response.status_code == 200
