import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"

const PURPLE = "#6C63FF"

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
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      })
      login(data.token, { email: data.email, name: data.name })
      navigate("/dashboard")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 420, border: "1px solid #f0f0f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${PURPLE}, #00C9A7)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>I</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e" }}>InferMesh</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>Welcome back</h2>
        <p style={{ fontSize: 13, color: "#aaa", marginBottom: "1.5rem" }}>Sign in to your account</p>

        {error && <div style={{ background: "#fff0f0", border: "1px solid #ffd0d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: "1rem" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#555", display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, outline: "none" }}
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#555", display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, outline: "none" }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 8, background: PURPLE, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#aaa", marginTop: "1.5rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: PURPLE, fontWeight: 500, textDecoration: "none" }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}