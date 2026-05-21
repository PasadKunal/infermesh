import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { apiFetch } from "../api"

const ACCENT = "#5865f2"

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState("verifying")
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) { setStatus("error"); return }
    if (status !== "verifying") return

    apiFetch(`/auth/verify-email?token=${token}`, { method: "GET" })
      .then(() => {
        setStatus("success")
        setTimeout(() => navigate("/dashboard"), 3000)
      })
      .catch(() => {
        if (status === "verifying") setStatus("error")
      })
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>I</span>
        </div>

        {status === "verifying" && (
          <>
            <div style={{ width: 32, height: 32, border: `2px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 500, margin: 0 }}>Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ width: 48, height: 48, background: "#0d2010", border: "1px solid #22c55e33", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Email verified</p>
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>Redirecting to dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ width: 48, height: 48, background: "#1a0a0a", border: "1px solid #ef444433", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Invalid or expired link</p>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 24px" }}>The verification link may have expired.</p>
            <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 20px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Go to dashboard
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
