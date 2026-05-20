import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NAV = [
  { path: "/dashboard", icon: "chart", label: "Dashboard" },
  { path: "/playground", icon: "terminal", label: "Playground" },
  { path: "/history", icon: "history", label: "History" },
  { path: "/settings", icon: "settings", label: "Settings" },
]

function Icon({ name, size = 18 }) {
  const icons = {
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16V12M12 16V8M17 16V11"/></svg>,
    terminal: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    history: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  }
  return icons[name] || null
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: "#111111", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1f1f1f" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "#5865f2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>I</span>
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>InferMesh</p>
              <p style={{ color: "#555", fontSize: 11, margin: 0 }}>LLM Gateway</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: active ? "#1a1a2e" : "transparent", color: active ? "#5865f2" : "#666", cursor: "pointer", fontSize: 13, fontWeight: active ? 500 : 400, marginBottom: 2, transition: "all .15s", textAlign: "left" }}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <div style={{ padding: "10px 12px", marginBottom: 4 }}>
            <p style={{ color: "#fff", fontSize: 12, fontWeight: 500, margin: 0 }}>{user?.name || "User"}</p>
            <p style={{ color: "#555", fontSize: 11, margin: 0 }}>{user?.email}</p>
          </div>
          <button
            onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#555", cursor: "pointer", fontSize: 13, transition: "all .15s", textAlign: "left" }}
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: "#0f0f0f", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  )
}
