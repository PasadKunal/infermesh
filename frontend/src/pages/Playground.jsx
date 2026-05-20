import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"

const PURPLE = "#6C63FF"
const TEAL = "#00C9A7"
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function Playground() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState("gemini-3.1-flash-lite-preview")
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(null)
  const [noKey, setNoKey] = useState(false)
  const bottomRef = useRef(null)

  const totalSaved = history.reduce((acc, r) => acc + (r.cache_hit ? r.savedAmount : 0), 0)
  const cacheHits = history.filter(r => r.cache_hit).length

  useEffect(() => {
    apiFetch("/keys/list", {}, token)
      .then(keys => {
        if (keys.length > 0) setApiKey(keys[0].full_key || null)
        else setNoKey(true)
      })
      .catch(() => setNoKey(true))
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history])

  const sendPrompt = async () => {
    if (!prompt.trim() || loading) return
    if (!apiKey) { setNoKey(true); return }

    const userPrompt = prompt.trim()
    setPrompt("")
    setLoading(true)

    const start = Date.now()

    try {
      const res = await fetch(`${BASE}/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userPrompt }],
          model
        })
      })
      const data = await res.json()
      const elapsed = Date.now() - start

      setHistory(prev => [...prev, {
        id: Date.now(),
        prompt: userPrompt,
        response: data.content || data.detail,
        provider: data.provider,
        latency_ms: data.latency_ms ?? elapsed,
        cost_usd: data.cost_usd ?? 0,
        cache_hit: data.cache_hit,
        savedAmount: data.cache_hit ? (prev.findLast(r => !r.cache_hit)?.cost_usd || 0.00002) : 0,
        error: !data.content
      }])
    } catch (e) {
      setHistory(prev => [...prev, {
        id: Date.now(),
        prompt: userPrompt,
        response: "Request failed — check your API key and Gemini key in settings",
        provider: "error",
        latency_ms: 0,
        cost_usd: 0,
        cache_hit: false,
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendPrompt()
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      <div style={{ background: "#1a1a2e", padding: "0 2rem", flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>I</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>InferMesh</span>
            <span style={{ background: "rgba(108,99,255,0.25)", color: "#a89fff", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>Playground</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate("/dashboard")} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Dashboard</button>
            <button onClick={() => navigate("/settings")} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Settings</button>
            <button onClick={logout} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", flex: 1, width: "100%", boxSizing: "border-box" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Playground</h1>
            <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Send prompts and watch the semantic cache in action</p>
          </div>

          {history.length > 0 && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", border: "1px solid #f0f0f0", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cache hits</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: PURPLE }}>{cacheHits}/{history.length}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", border: "1px solid #f0f0f0", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Saved</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TEAL }}>${totalSaved.toFixed(6)}</div>
              </div>
            </div>
          )}
        </div>

        {noKey && (
          <div style={{ background: "#fff8e6", border: "1px solid #ffd080", borderRadius: 12, padding: "14px 18px", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: "#8a6000", margin: 0 }}>You need a Gemini key and an InferMesh API key to use the playground</p>
            <button onClick={() => navigate("/settings")} style={{ padding: "8px 16px", borderRadius: 8, background: PURPLE, color: "#fff", border: "none", fontSize: 13, cursor: "pointer" }}>Go to Settings</button>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: "1rem", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Model</span>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ fontSize: 13, color: "#333", border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", outline: "none", background: "#fff" }}
            >
              <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
              <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            </select>
          </div>

          <div style={{ padding: "1rem 1.5rem" }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a prompt and press Enter... Try sending the same question twice to see the cache hit!"
              rows={3}
              style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: "#1a1a2e", resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#ccc" }}>Press Enter to send · Shift+Enter for new line</span>
            <button
              onClick={sendPrompt}
              disabled={loading || !prompt.trim()}
              style={{ padding: "8px 20px", borderRadius: 8, background: loading || !prompt.trim() ? "#e0e0e0" : PURPLE, color: loading || !prompt.trim() ? "#aaa" : "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: loading || !prompt.trim() ? "not-allowed" : "pointer", transition: "all .15s" }}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        {history.length === 0 && !noKey && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "3rem", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
            <p style={{ color: "#333", fontWeight: 600, fontSize: 15 }}>Send your first prompt</p>
            <p style={{ color: "#aaa", fontSize: 13, marginTop: 4, maxWidth: 380, margin: "8px auto 0" }}>
              Try asking the same question twice — the second response will be instant and free thanks to semantic caching
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.map((item) => (
            <div key={item.id} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${item.cache_hit ? "#d0f0e0" : item.error ? "#ffd0d0" : "#f0f0f0"}`, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: item.cache_hit ? "#f0fff8" : item.error ? "#fff5f5" : "#fafafa", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>"{item.prompt.length > 80 ? item.prompt.slice(0, 80) + "..." : item.prompt}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {item.cache_hit ? (
                    <span style={{ background: "#00C9A7", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>⚡ Cache hit</span>
                  ) : (
                    <span style={{ background: PURPLE, color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>🤖 {item.provider}</span>
                  )}
                  <span style={{ fontSize: 12, color: "#aaa" }}>{item.latency_ms}ms</span>
                  <span style={{ fontSize: 12, color: item.cache_hit ? TEAL : "#aaa", fontWeight: item.cache_hit ? 600 : 400 }}>
                    {item.cache_hit ? "FREE" : `$${item.cost_usd.toFixed(6)}`}
                  </span>
                  {item.cache_hit && item.savedAmount > 0 && (
                    <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>💰 saved ${item.savedAmount.toFixed(6)}</span>
                  )}
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{item.response}</p>
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
