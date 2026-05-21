import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

const NAV = [
  { path: "/dashboard", label: "Dashboard", icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z" },
  { path: "/playground", label: "Playground", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { path: "/history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
]

function NavIcon({ d }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((segment, i) => (
        <path key={i} d={i === 0 ? segment : 'M' + segment} />
      ))}
    </svg>
  )
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside style={{ width: 232, background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>

        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>I</span>
            </div>
            <div>
              <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>InferMesh</p>
              <p style={{ color: "var(--text-3)", fontSize: 11, lineHeight: 1.2 }}>LLM Gateway</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: "8px", flex: 1 }}>
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: active ? "var(--accent-bg)" : "transparent", color: active ? "var(--accent-text)" : "var(--text-2)", cursor: "pointer", fontSize: 13, fontWeight: active ? 500 : 400, marginBottom: 1, transition: "background .1s, color .1s", textAlign: "left" }}
              >
                <NavIcon d={item.icon} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggle}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", color: "var(--text-2)", cursor: "pointer", fontSize: 13, marginBottom: 1 }}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <div style={{ padding: "8px 10px", marginBottom: 4 }}>
            <p style={{ color: "var(--text)", fontSize: 12, fontWeight: 500 }}>{user?.name || "User"}</p>
            <p style={{ color: "var(--text-3)", fontSize: 11 }}>{user?.email}</p>
          </div>

          <button
            onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: 13 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: "var(--bg-secondary)", minHeight: "100vh", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  )
}
