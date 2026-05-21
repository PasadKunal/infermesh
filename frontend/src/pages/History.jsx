import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"
import ReactMarkdown from "react-markdown"

const ACCENT = "#6366f1"
const GREEN = "#16a34a"

export default function History() {
  const { token } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    apiFetch("/metrics/history", {}, token)
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const filtered = logs.filter(l => {
    if (filter === "cache") return l.cache_hit
    if (filter === "gemini") return l.provider === "gemini"
    if (filter === "openai") return l.provider === "openai"
    if (filter === "anthropic") return l.provider === "anthropic"
    return true
  })

  const totalCost = logs.reduce((acc, l) => acc + l.cost_usd, 0)
  const cacheHits = logs.filter(l => l.cache_hit).length

  const providerColor = (p) => {
    if (p === "cache") return { bg: "var(--green-bg)", border: "var(--green-border)", text: "var(--green)" }
    if (p === "openai") return { bg: "var(--accent-bg)", border: "transparent", text: "var(--accent-text)" }
    if (p === "anthropic") return { bg: "#fdf4ff", border: "transparent", text: "#7e22ce" }
    return { bg: "var(--accent-bg)", border: "transparent", text: "var(--accent-text)" }
  }

  return (
    <Layout>
      <div style={{ padding: "32px 28px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>Request history</h1>
          <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>Last 50 requests across all your API keys</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            ["Total requests", logs.length],
            ["Cache hits", `${cacheHits} (${logs.length ? Math.round(cacheHits / logs.length * 100) : 0}%)`],
            ["Total cost", `$${totalCost.toFixed(6)}`],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>{label}</p>
              <p style={{ color: "var(--text)", fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "var(--bg-tertiary)", borderRadius: 8, padding: 4, width: "fit-content" }}>
          {["all", "cache", "gemini", "openai", "anthropic"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: filter === f ? "var(--card-bg)" : "transparent", color: filter === f ? "var(--text)" : "var(--text-3)", fontSize: 12, fontWeight: filter === f ? 500 : 400, cursor: "pointer", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {f === "all" ? "All" : f === "openai" ? "OpenAI" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 24, height: 24, border: `2px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 40px", textAlign: "center" }}>
            <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 500, margin: "0 0 6px" }}>No requests found</p>
            <p style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}>
              {filter === "all" ? "Send your first request from the Playground" : `No ${filter} requests yet`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(log => {
              const pc = providerColor(log.provider)
              return (
                <div key={log.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                  <div
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: expanded === log.id ? "var(--bg-tertiary)" : "transparent" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text, fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 500, flexShrink: 0, textTransform: "capitalize" }}>
                        {log.cache_hit ? "Cache" : log.provider}
                      </span>
                      <p style={{ color: "var(--text)", fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.prompt_text}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginLeft: 12 }}>
                      {log.eval_score && (
                        <span style={{ background: log.eval_score >= 8 ? "var(--green-bg)" : log.eval_score >= 6 ? "var(--amber-bg)" : "var(--red-bg)", color: log.eval_score >= 8 ? "var(--green)" : log.eval_score >= 6 ? "var(--amber)" : "var(--red)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
                          {log.eval_score}/10
                        </span>
                      )}
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{log.latency_ms}ms</span>
                      <span style={{ color: log.cache_hit ? "var(--green)" : "var(--text-2)", fontSize: 12, fontWeight: log.cache_hit ? 500 : 400, minWidth: 80, textAlign: "right" }}>
                        {log.cache_hit ? "FREE" : `$${log.cost_usd.toFixed(6)}`}
                      </span>
                      <span style={{ color: "var(--text-3)", fontSize: 11, minWidth: 140, textAlign: "right" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" style={{ transform: expanded === log.id ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  {expanded === log.id && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                        <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Prompt</p>
                        <p style={{ color: "var(--text)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{log.prompt_text}</p>
                      </div>
                      <div style={{ padding: "14px 16px", maxHeight: 320, overflowY: "auto" }}>
                        <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Response</p>
                        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75 }}>
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...p}) => <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "10px 0 4px" }} {...p} />,
                              h2: ({node, ...p}) => <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "8px 0 4px" }} {...p} />,
                              h3: ({node, ...p}) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "6px 0 4px" }} {...p} />,
                              p: ({node, ...p}) => <p style={{ margin: "4px 0" }} {...p} />,
                              ul: ({node, ...p}) => <ul style={{ paddingLeft: 18, margin: "4px 0" }} {...p} />,
                              li: ({node, ...p}) => <li style={{ margin: "2px 0" }} {...p} />,
                              code: ({node, inline, ...p}) => inline
                                ? <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: ACCENT }} {...p} />
                                : <pre style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", padding: "12px", borderRadius: 8, overflow: "auto", fontSize: 12, margin: "8px 0" }}><code style={{ color: ACCENT, fontFamily: "monospace" }} {...p} /></pre>,
                              strong: ({node, ...p}) => <strong style={{ color: "var(--text)", fontWeight: 600 }} {...p} />,
                            }}
                          >{log.response_text}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  )
}
