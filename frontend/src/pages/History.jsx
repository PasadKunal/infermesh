import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"
import ReactMarkdown from "react-markdown"

const ACCENT = "#5865f2"
const GREEN = "#22c55e"

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

  const btnStyle = (active) => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    background: active ? "#1a1a2e" : "transparent",
    color: active ? ACCENT : "#555",
    fontSize: 12,
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    transition: "all .15s"
  })

  return (
    <Layout>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Request History</h1>
          <p style={{ color: "#555", fontSize: 13, margin: "4px 0 0" }}>Last 50 requests across all your API keys</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            ["Total requests", logs.length],
            ["Cache hits", `${cacheHits} (${logs.length ? Math.round(cacheHits / logs.length * 100) : 0}%)`],
            ["Total cost", `$${totalCost.toFixed(6)}`],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ color: "#666", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{label}</p>
              <p style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, padding: 4, width: "fit-content" }}>
          {["all", "cache", "gemini", "openai", "anthropic"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={btnStyle(filter === f)}>
              {f === "all" ? "All" : f === "openai" ? "OpenAI" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: "60px 40px", textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>No requests found</p>
            <p style={{ color: "#444", fontSize: 13, margin: 0 }}>
              {filter === "all" ? "Send your first request from the Playground" : `No ${filter} requests yet`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(log => (
              <div key={log.id} style={{ background: "#111", border: `1px solid ${log.cache_hit ? "#22c55e22" : "#1f1f1f"}`, borderRadius: 12, overflow: "hidden" }}>
                <div
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: expanded === log.id ? "#161616" : "transparent" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    {log.cache_hit
                      ? <span style={{ background: "#0d2010", border: "1px solid #22c55e33", color: GREEN, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>Cache</span>
                      : <span style={{ background: "#1a1a2e", border: "1px solid #5865f233", color: ACCENT, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, flexShrink: 0, textTransform: "capitalize" }}>{log.provider}</span>
                    }
                    <p style={{ color: "#ccc", fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.prompt_text}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ color: "#444", fontSize: 12 }}>{log.latency_ms}ms</span>
                    <span style={{ color: log.cache_hit ? GREEN : "#555", fontSize: 12, fontWeight: log.cache_hit ? 500 : 400 }}>
                      {log.cache_hit ? "FREE" : `$${log.cost_usd.toFixed(6)}`}
                    </span>
                    {log.eval_score && (
                      <span style={{ background: log.eval_score >= 8 ? "#0d2010" : log.eval_score >= 6 ? "#1a1500" : "#1a0a0a", border: `1px solid ${log.eval_score >= 8 ? "#22c55e33" : log.eval_score >= 6 ? "#f59e0b33" : "#ef444433"}`, color: log.eval_score >= 8 ? "#22c55e" : log.eval_score >= 6 ? "#f59e0b" : "#ef4444", fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 500 }}>
                        {log.eval_score}/10
                      </span>
                    )}
                    <span style={{ color: "#333", fontSize: 11 }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" style={{ transform: expanded === log.id ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {expanded === log.id && (
                  <div style={{ borderTop: "1px solid #1a1a1a" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
                      <p style={{ color: "#666", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Prompt</p>
                      <p style={{ color: "#ccc", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{log.prompt_text}</p>
                    </div>
                    <div style={{ padding: "16px 20px", maxHeight: 300, overflowY: "auto" }}>
                      <p style={{ color: "#666", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Response</p>
                      <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.75 }}>
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...p}) => <h1 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "10px 0 4px" }} {...p} />,
                            h2: ({node, ...p}) => <h2 style={{ fontSize: 14, fontWeight: 600, color: "#ddd", margin: "8px 0 4px" }} {...p} />,
                            h3: ({node, ...p}) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "#ccc", margin: "6px 0 4px" }} {...p} />,
                            p: ({node, ...p}) => <p style={{ margin: "4px 0" }} {...p} />,
                            ul: ({node, ...p}) => <ul style={{ paddingLeft: 18, margin: "4px 0" }} {...p} />,
                            li: ({node, ...p}) => <li style={{ margin: "2px 0" }} {...p} />,
                            code: ({node, inline, ...p}) => inline
                              ? <code style={{ background: "#1a1a1a", padding: "1px 5px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: "#a78bfa" }} {...p} />
                              : <pre style={{ background: "#0d0d0d", border: "1px solid #222", padding: "12px", borderRadius: 8, overflow: "auto", fontSize: 12, margin: "8px 0" }}><code style={{ color: "#a78bfa", fontFamily: "monospace" }} {...p} /></pre>,
                            strong: ({node, ...p}) => <strong style={{ color: "#fff", fontWeight: 600 }} {...p} />,
                          }}
                        >{log.response_text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  )
}
