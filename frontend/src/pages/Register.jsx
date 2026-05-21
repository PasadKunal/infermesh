import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"

const ACCENT = "#5865f2"

export default function Register() {
  const [name, setName] = useState("")
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
      const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) })
      navigate("/verify-pending", { state: { token: data.token, email: data.email } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: "100%", padding: "11px 14px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>I</span>
          </div>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>InferMesh</span>
        </div>

        <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "36px 36px" }}>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Create your account</h1>
          <p style={{ color: "#555", fontSize: 13, margin: "0 0 28px" }}>Start monitoring your LLM usage today</p>

          {error && (
            <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", marginBottom: 20 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p style={{ color: "#555", fontSize: 13, marginTop: 20, textAlign: "center" }}>
            Already have an account? <Link to="/login" style={{ color: ACCENT, textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
