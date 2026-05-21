import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
      login(data.token, { email: data.email, name: data.name })
      navigate("/dashboard")
    } catch (err) {
      setError(err.message?.includes("verify") ? "Please verify your email before logging in." : err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: "100%", padding: "9px 12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none", fontSize: 14, boxSizing: "border-box" }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", borderRight: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
          <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>I</span>
          </div>
          <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>InferMesh</span>
        </div>

        <h1 style={{ color: "var(--text)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 28 }}>Sign in to your account to continue</p>

        {error && (
          <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: 18 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inp} />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 20, textAlign: "center" }}>
          No account? <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Create one</Link>
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Why InferMesh</p>
        <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3, marginBottom: 14 }}>Stop paying for the same LLM responses twice</h2>
        <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>InferMesh routes requests through a semantic cache. Similar questions return instantly at zero cost. Bring your own keys and see exactly what you spend.</p>
        {[
          ["Semantic cache", "Similar prompts served from cache at $0 cost"],
          ["Your own keys", "Gemini, OpenAI, or Anthropic. You control spend."],
          ["Full observability", "Cost, latency, and quality metrics in real time"],
          ["Streaming", "Responses stream token by token via SSE"],
        ].map(([title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: "var(--green-bg)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 500, marginBottom: 1 }}>{title}</p>
              <p style={{ color: "var(--text-3)", fontSize: 12 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
