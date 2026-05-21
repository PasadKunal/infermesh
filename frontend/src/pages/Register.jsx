import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { apiFetch } from "../api"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) })
      navigate("/verify-pending", { state: { token: data.token, email: data.email } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: "100%", padding: "9px 12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none", fontSize: 14, boxSizing: "border-box" }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>I</span>
          </div>
          <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>InferMesh</span>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 28px" }}>
          <h1 style={{ color: "var(--text)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>Create your account</h1>
          <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 22 }}>Start monitoring your LLM usage today</p>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: 16 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required style={inp} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inp} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} style={inp} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 18, textAlign: "center" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
