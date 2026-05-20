import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"
import ReactMarkdown from "react-markdown"

const ACCENT = "#5865f2"
const GREEN = "#22c55e"
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function Playground() {
  const { token } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState("gemini-3.1-flash-lite-preview")
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [keys, setKeys] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [hasGeminiKey, setHasGeminiKey] = useState(true)
  const [totalSaved, setTotalSaved] = useState(0)
  const [cacheHits, setCacheHits] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    apiFetch("/metrics/savings", {}, token).then(s => {
      setTotalSaved(s.estimated_saved_usd)
    }).catch(console.error)

    apiFetch("/metrics/history", {}, token).then(logs => {
      setHistory(logs.map(l => ({
        id: l.id,
        prompt: l.prompt_text,
        response: l.response_text,
        provider: l.provider,
        latency_ms: l.latency_ms,
        cost_usd: l.cost_usd,
        cache_hit: l.cache_hit,
        savedAmount: 0,
        error: false
      })).reverse())
    }).catch(console.error)

    apiFetch("/keys/list", {}, token).then(k => {
      setKeys(k)
      if (k.length > 0) setSelectedKey(k[0].full_key)
    }).catch(console.error)

    apiFetch("/auth/gemini-key", {}, token)
      .then(d => setHasGeminiKey(d.has_key))
      .catch(console.error)

    apiFetch("/metrics/summary", {}, token).then(s => {
      setCacheHits(s.cache_hit_rate)
    }).catch(console.error)
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history])

  const sendPrompt = async () => {
    if (!prompt.trim() || loading || !selectedKey) return
    const userPrompt = prompt.trim()
    setPrompt("")
    setLoading(true)

    try {
      const res = await fetch(`${BASE}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": selectedKey },
        body: JSON.stringify({ messages: [{ role: "user", content: userPrompt }], model })
      })
      const data = await res.json()

      const saved = data.cache_hit
        ? (history.findLast(r => !r.cache_hit && !r.error)?.cost_usd || 0.00002)
        : 0

      setTotalSaved(prev => prev + saved)

      setHistory(prev => [...prev, {
        id: Date.now(),
        prompt: userPrompt,
        response: data.content || data.detail || "Error",
        provider: data.provider,
        latency_ms: data.latency_ms ?? 0,
        cost_usd: data.cost_usd ?? 0,
        cache_hit: data.cache_hit,
        savedAmount: saved,
        error: !data.content
      }])
    } catch {
      setHistory(prev => [...prev, {
        id: Date.now(), prompt: userPrompt,
        response: "Request failed. Check your settings.",
        provider: "error", latency_ms: 0, cost_usd: 0,
        cache_hit: false, savedAmount: 0, error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const sessionHits = history.filter(r => r.cache_hit).length
  const inputStyle = { padding: "8px 12px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none" }

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Playground</h1>
              <p style={{ color: "#555", fontSize: 13, margin: "2px 0 0" }}>Test your prompts and watch the cache in action</p>
            </div>
            {history.length > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                  <p style={{ color: "#555", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Session hits</p>
                  <p style={{ color: ACCENT, fontSize: 18, fontWeight: 600, margin: 0 }}>{sessionHits}/{history.length}</p>
                </div>
                <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                  <p style={{ color: "#555", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Saved</p>
                  <p style={{ color: GREEN, fontSize: 18, fontWeight: 600, margin: 0 }}>${totalSaved.toFixed(6)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {!hasGeminiKey && (
            <div style={{ background: "#1a1500", border: "1px solid #f59e0b33", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ color: "#f59e0b", fontSize: 13, margin: 0 }}>Add your Gemini API key in Settings to use the playground</p>
            </div>
          )}

          {history.length === 0 && hasGeminiKey && (
            <div style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ width: 48, height: 48, background: "#141414", border: "1px solid #222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p style={{ color: "#ccc", fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>Send your first prompt</p>
              <p style={{ color: "#444", fontSize: 13, margin: 0, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
                Try asking the same question twice. The second response will be instant and free thanks to semantic caching.
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800, margin: "0 auto" }}>
            {history.map(item => (
              <div key={item.id} style={{ background: "#111", border: `1px solid ${item.cache_hit ? "#22c55e22" : item.error ? "#ef444422" : "#1f1f1f"}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", background: item.cache_hit ? "#0a1f0a" : item.error ? "#1a0a0a" : "#161616", borderBottom: `1px solid ${item.cache_hit ? "#22c55e22" : "#1a1a1a"}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", margin: 0 }}>
                    {item.prompt.length > 80 ? item.prompt.slice(0, 80) + "..." : item.prompt}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {item.cache_hit
                      ? <span style={{ background: "#0d2010", border: "1px solid #22c55e33", color: GREEN, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>Cache hit</span>
                      : <span style={{ background: "#1a1a2e", border: "1px solid #5865f233", color: ACCENT, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>{item.provider}</span>
                    }
                    <span style={{ color: "#444", fontSize: 12 }}>{item.latency_ms}ms</span>
                    <span style={{ color: item.cache_hit ? GREEN : "#555", fontSize: 12, fontWeight: item.cache_hit ? 500 : 400 }}>
                      {item.cache_hit ? "FREE" : `$${item.cost_usd.toFixed(6)}`}
                    </span>
                    {item.cache_hit && item.savedAmount > 0 && (
                      <span style={{ color: GREEN, fontSize: 12, fontWeight: 500 }}>saved ${item.savedAmount.toFixed(6)}</span>
                    )}
                  </div>
                </div>
                <div style={{ padding: "16px 18px", maxHeight: 400, overflowY: "auto" }}>
                  <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.75 }}>
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...p}) => <h1 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "14px 0 6px" }} {...p} />,
                        h2: ({node, ...p}) => <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "12px 0 6px" }} {...p} />,
                        h3: ({node, ...p}) => <h3 style={{ fontSize: 14, fontWeight: 600, color: "#ddd", margin: "10px 0 4px" }} {...p} />,
                        h4: ({node, ...p}) => <h4 style={{ fontSize: 13, fontWeight: 600, color: "#ccc", margin: "8px 0 4px" }} {...p} />,
                        p: ({node, ...p}) => <p style={{ margin: "6px 0" }} {...p} />,
                        ul: ({node, ...p}) => <ul style={{ paddingLeft: 20, margin: "6px 0" }} {...p} />,
                        ol: ({node, ...p}) => <ol style={{ paddingLeft: 20, margin: "6px 0" }} {...p} />,
                        li: ({node, ...p}) => <li style={{ margin: "3px 0" }} {...p} />,
                        code: ({node, inline, ...p}) => inline
                          ? <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: "#a78bfa" }} {...p} />
                          : <pre style={{ background: "#0d0d0d", border: "1px solid #222", padding: "14px", borderRadius: 8, overflow: "auto", fontSize: 12, fontFamily: "monospace", margin: "10px 0" }}><code style={{ color: "#a78bfa" }} {...p} /></pre>,
                        strong: ({node, ...p}) => <strong style={{ color: "#fff", fontWeight: 600 }} {...p} />,
                        hr: () => <hr style={{ border: "none", borderTop: "1px solid #1f1f1f", margin: "14px 0" }} />,
                      }}
                    >{item.response}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "16px 32px", borderTop: "1px solid #1a1a1a", background: "#0f0f0f", flexShrink: 0 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <select value={selectedKey || ""} onChange={e => setSelectedKey(e.target.value)} style={{ ...inputStyle, flex: "none" }}>
                {keys.length === 0 && <option value="">No keys</option>}
                {keys.map(k => <option key={k.id} value={k.full_key}>{k.name}</option>)}
              </select>
              <select value={model} onChange={e => setModel(e.target.value)} style={{ ...inputStyle, flex: "none" }}>
                <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
                <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt() } }}
                placeholder="Type a prompt and press Enter..."
                rows={2}
                style={{ flex: 1, padding: "11px 14px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <button
                onClick={sendPrompt}
                disabled={loading || !prompt.trim() || !selectedKey}
                style={{ padding: "0 20px", background: loading || !prompt.trim() || !selectedKey ? "#1a1a1a" : ACCENT, color: loading || !prompt.trim() || !selectedKey ? "#444" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: loading || !prompt.trim() || !selectedKey ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
            <p style={{ color: "#333", fontSize: 11, margin: "8px 0 0" }}>Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
