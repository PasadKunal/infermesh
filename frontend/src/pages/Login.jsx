import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"

const ACCENT = "#5865f2"

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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", borderRight: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 60 }}>
          <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>I</span>
          </div>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>InferMesh</span>
        </div>

        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Welcome back</h1>
        <p style={{ color: "#555", fontSize: 14, margin: "0 0 36px" }}>Sign in to your account to continue</p>

        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", marginBottom: 20 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@company.com"
              style={{ width: "100%", padding: "11px 14px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: "100%", padding: "11px 14px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ color: "#555", fontSize: 13, marginTop: 24, textAlign: "center" }}>
          No account? <Link to="/register" style={{ color: ACCENT, textDecoration: "none", fontWeight: 500 }}>Create one</Link>
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: "#5865f2", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>Why InferMesh</p>
          <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 600, margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>Stop paying for the same LLM responses twice</h2>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, margin: 0 }}>InferMesh routes your LLM requests through a semantic cache. Similar questions return instantly at zero cost. Bring your own Gemini key and see exactly what you spend.</p>
        </div>
        {[
          ["Semantic cache", "Similar prompts served from cache at $0 cost"],
          ["Your own key", "Bring your Gemini key. You control your spend."],
          ["Full observability", "Cost, latency, and cache metrics in real time"],
        ].map(([title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 20, height: 20, background: "#0d1117", border: "1px solid #22c55e33", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ color: "#ccc", fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{title}</p>
              <p style={{ color: "#555", fontSize: 13, margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
