import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"
import ReactMarkdown from "react-markdown"

const ACCENT = "#6366f1"
const GREEN = "#16a34a"
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function Playground() {
  const { token } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState("gemini-3.1-flash-lite-preview")
  const [history, setHistory] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [streamingPrompt, setStreamingPrompt] = useState("")
  const [keys, setKeys] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false)
  const [totalSaved, setTotalSaved] = useState(0)
  const bottomRef = useRef(null)

  const sessionHits = history.filter(r => r.cache_hit).length
  const hasAnyKey = hasGeminiKey || hasOpenAIKey || hasAnthropicKey

  useEffect(() => {
    apiFetch("/metrics/savings", {}, token).then(s => setTotalSaved(s.estimated_saved_usd)).catch(console.error)
    apiFetch("/keys/list", {}, token).then(k => { setKeys(k); if (k.length > 0) setSelectedKey(k[0].full_key) }).catch(console.error)
    apiFetch("/auth/gemini-key", {}, token).then(d => setHasGeminiKey(d.has_key)).catch(console.error)
    apiFetch("/auth/openai-key", {}, token).then(d => setHasOpenAIKey(d.has_key)).catch(console.error)
    apiFetch("/auth/anthropic-key", {}, token).then(d => setHasAnthropicKey(d.has_key)).catch(console.error)
  }, [token])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [history, streamingText])

  const sendPrompt = async () => {
    if (!prompt.trim() || streaming || !selectedKey) return
    const userPrompt = prompt.trim()
    setPrompt("")
    setStreaming(true)
    setStreamingText("")
    setStreamingPrompt(userPrompt)

    try {
      const res = await fetch(`${BASE}/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": selectedKey },
        body: JSON.stringify({ messages: [{ role: "user", content: userPrompt }], model })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      let isCacheHit = false
      let latency = 0
      let cost = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) { fullText += data.text; setStreamingText(fullText); isCacheHit = data.cache_hit }
            if (data.done) { latency = data.latency_ms || 0; cost = data.cost_usd || 0 }
            if (data.error) { fullText = `Error: ${data.error}`; setStreamingText(fullText) }
          } catch {}
        }
      }

      const saved = isCacheHit ? (history.findLast(r => !r.cache_hit && !r.error)?.cost_usd || 0.00002) : 0
      setTotalSaved(prev => prev + saved)
      setHistory(prev => [...prev, { id: Date.now(), prompt: userPrompt, response: fullText, provider: isCacheHit ? "cache" : model.startsWith("gpt") ? "openai" : model.startsWith("claude") ? "anthropic" : "gemini", latency_ms: latency, cost_usd: cost, cache_hit: isCacheHit, savedAmount: saved, error: false }])
    } catch {
      setHistory(prev => [...prev, { id: Date.now(), prompt: userPrompt, response: "Request failed. Check your settings.", provider: "error", latency_ms: 0, cost_usd: 0, cache_hit: false, savedAmount: 0, error: true }])
    } finally {
      setStreaming(false)
      setStreamingText("")
      setStreamingPrompt("")
    }
  }

  const mdComponents = {
    h1: ({node, ...p}) => <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "12px 0 4px" }} {...p} />,
    h2: ({node, ...p}) => <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "10px 0 4px" }} {...p} />,
    h3: ({node, ...p}) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "8px 0 4px" }} {...p} />,
    p: ({node, ...p}) => <p style={{ margin: "5px 0" }} {...p} />,
    ul: ({node, ...p}) => <ul style={{ paddingLeft: 20, margin: "5px 0" }} {...p} />,
    ol: ({node, ...p}) => <ol style={{ paddingLeft: 20, margin: "5px 0" }} {...p} />,
    li: ({node, ...p}) => <li style={{ margin: "2px 0" }} {...p} />,
    code: ({node, inline, ...p}) => inline
      ? <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: ACCENT }} {...p} />
      : <pre style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", padding: "12px", borderRadius: 8, overflow: "auto", fontSize: 12, margin: "8px 0" }}><code style={{ color: ACCENT, fontFamily: "monospace" }} {...p} /></pre>,
    strong: ({node, ...p}) => <strong style={{ color: "var(--text)", fontWeight: 600 }} {...p} />,
    hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />,
  }

  const providerBadge = (provider, cacheHit) => {
    if (cacheHit) return { bg: "var(--green-bg)", border: "var(--green-border)", text: "var(--green)", label: "Cache hit" }
    if (provider === "openai") return { bg: "var(--accent-bg)", border: "transparent", text: "var(--accent-text)", label: "OpenAI" }
    if (provider === "anthropic") return { bg: "#fdf4ff", border: "transparent", text: "#7e22ce", label: "Anthropic" }
    return { bg: "var(--accent-bg)", border: "transparent", text: "var(--accent-text)", label: "Gemini" }
  }

  const selStyle = { padding: "7px 11px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, outline: "none" }

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--bg-secondary)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ color: "var(--text)", fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Playground</h1>
              <p style={{ color: "var(--text-3)", fontSize: 13, margin: "2px 0 0" }}>Test prompts and watch the cache in action</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                <p style={{ color: "var(--text-3)", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Session hits</p>
                <p style={{ color: ACCENT, fontSize: 18, fontWeight: 600, margin: 0 }}>{sessionHits}/{history.length || 0}</p>
              </div>
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                <p style={{ color: "var(--text-3)", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>All-time saved</p>
                <p style={{ color: "var(--green)", fontSize: 18, fontWeight: 600, margin: 0 }}>${totalSaved.toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {!hasAnyKey && (
            <div style={{ background: "var(--amber-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ color: "var(--amber)", fontSize: 13, margin: 0 }}>Add a provider API key in Settings to use the playground.</p>
            </div>
          )}

          {history.length === 0 && !streaming && hasAnyKey && (
            <div style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ width: 44, height: 44, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 500, margin: "0 0 6px" }}>Send your first prompt</p>
              <p style={{ color: "var(--text-3)", fontSize: 13, margin: "0 auto", maxWidth: 340, lineHeight: 1.6 }}>
                Ask the same question twice. The second response will be instant and free.
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 860, margin: "0 auto" }}>
            {history.map(item => {
              const b = providerBadge(item.provider, item.cache_hit)
              return (
                <div key={item.id} style={{ background: "var(--card-bg)", border: `1px solid ${item.cache_hit ? "var(--green-border)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", background: item.cache_hit ? "var(--green-bg)" : "var(--bg-tertiary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                      {item.prompt.length > 80 ? item.prompt.slice(0, 80) + "..." : item.prompt}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: b.bg, border: `1px solid ${b.border}`, color: b.text, fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>{b.label}</span>
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{item.latency_ms}ms</span>
                      <span style={{ color: item.cache_hit ? "var(--green)" : "var(--text-2)", fontSize: 12, fontWeight: item.cache_hit ? 500 : 400 }}>
                        {item.cache_hit ? "FREE" : `$${item.cost_usd.toFixed(6)}`}
                      </span>
                      {item.cache_hit && item.savedAmount > 0 && (
                        <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 500 }}>saved ${item.savedAmount.toFixed(6)}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px", maxHeight: 400, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75 }}>
                      <ReactMarkdown components={mdComponents}>{item.response}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )
            })}

            {streaming && (
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                    {streamingPrompt.length > 80 ? streamingPrompt.slice(0, 80) + "..." : streamingPrompt}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT, animation: `bounce .8s ${i * 0.15}s infinite` }} />)}
                    <span style={{ color: "var(--text-3)", fontSize: 12, marginLeft: 4 }}>generating...</span>
                  </div>
                </div>
                <div style={{ padding: "14px 16px", maxHeight: 400, overflowY: "auto" }}>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75 }}>
                    <ReactMarkdown components={mdComponents}>{streamingText || " "}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "14px 28px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <select value={selectedKey || ""} onChange={e => setSelectedKey(e.target.value)} style={selStyle}>
                {keys.length === 0 && <option value="">No keys</option>}
                {keys.map(k => <option key={k.id} value={k.full_key}>{k.name}</option>)}
              </select>
              <select value={model} onChange={e => setModel(e.target.value)} style={selStyle}>
                {hasGeminiKey && <>
                  <option disabled>Gemini</option>
                  <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
                  <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                </>}
                {hasOpenAIKey && <>
                  <option disabled>OpenAI</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </>}
                {hasAnthropicKey && <>
                  <option disabled>Anthropic</option>
                  <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022</option>
                  <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                  <option value="claude-opus-4-5">claude-opus-4-5</option>
                </>}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt() } }}
                placeholder="Type a prompt and press Enter..."
                rows={2}
                style={{ flex: 1, padding: "10px 14px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <button
                onClick={sendPrompt}
                disabled={streaming || !prompt.trim() || !selectedKey}
                style={{ padding: "0 20px", background: streaming || !prompt.trim() || !selectedKey ? "var(--bg-tertiary)" : ACCENT, color: streaming || !prompt.trim() || !selectedKey ? "var(--text-3)" : "#fff", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: streaming || !prompt.trim() || !selectedKey ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
              >
                {streaming ? "..." : "Send"}
              </button>
            </div>
            <p style={{ color: "var(--text-3)", fontSize: 11, margin: "6px 0 0" }}>Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-4px);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  )
}
