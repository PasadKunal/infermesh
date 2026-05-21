import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { apiFetch } from "../api"

const ACCENT = "#5865f2"

export default function VerifyPending() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = location.state?.token
  const email = location.state?.email
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>I</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Check your email</h1>
          <p style={{ color: "#555", fontSize: 13, margin: "0 0 24px" }}>A verification link was sent to your email address.</p>
          <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Back to login
          </button>
        </div>
      </div>
    )
  }

  const resend = async () => {
    if (!token) return
    setResending(true)
    try {
      await apiFetch("/auth/resend-verification", { method: "POST" }, token)
      setResent(true)
    } catch (e) {
      console.error(e)
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>I</span>
        </div>

        <div style={{ width: 56, height: 56, background: "#1a1a2e", border: "1px solid #5865f233", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Check your email</h1>
        <p style={{ color: "#555", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>We sent a verification link to</p>
        <p style={{ color: "#ccc", fontSize: 14, fontWeight: 500, margin: "0 0 28px" }}>{email}</p>

        <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 10, padding: "16px", marginBottom: 24, textAlign: "left" }}>
          <p style={{ color: "#888", fontSize: 12, margin: "0 0 8px", fontWeight: 500 }}>Next steps:</p>
          {["Open the email from InferMesh", "Click the verification link", "You will be redirected to your dashboard"].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1a2e", border: "1px solid #5865f233", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: ACCENT, fontSize: 10, fontWeight: 600 }}>{i + 1}</span>
              </div>
              <p style={{ color: "#666", fontSize: 12, margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>

        {resent ? (
          <p style={{ color: "#22c55e", fontSize: 13, margin: "0 0 16px" }}>Verification email resent.</p>
        ) : (
          <button onClick={resend} disabled={resending} style={{ background: "transparent", border: "none", color: ACCENT, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16, display: "block", margin: "0 auto 16px" }}>
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        )}

        <p style={{ color: "#333", fontSize: 12, margin: 0 }}>
          Already verified?{" "}
          <span onClick={() => navigate("/login")} style={{ color: ACCENT, cursor: "pointer" }}>Sign in</span>
        </p>
      </div>
    </div>
  )
}
