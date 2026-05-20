import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import { useNavigate } from "react-router-dom"

const PURPLE = "#6C63FF"
const TEAL = "#00C9A7"

export default function Settings() {
  const { user, token, logout } = useAuth()
  const [keys, setKeys] = useState([])
  const [keyName, setKeyName] = useState("")
  const [newKey, setNewKey] = useState(null)
  const [keyLoading, setKeyLoading] = useState(false)
  const [geminiKey, setGeminiKey] = useState("")
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch("/keys/list", {}, token).then(setKeys).catch(console.error)
    apiFetch("/auth/gemini-key", {}, token)
      .then(d => setHasGeminiKey(d.has_key))
      .catch(console.error)
  }, [token])

  const saveGeminiKey = async () => {
    if (!geminiKey.trim()) return
    setGeminiLoading(true)
    setGeminiMsg(null)
    try {
      await apiFetch("/auth/gemini-key", {
        method: "PUT",
        body: JSON.stringify({ gemini_api_key: geminiKey })
      }, token)
      setHasGeminiKey(true)
      setGeminiKey("")
      setGeminiMsg({ type: "success", text: "Gemini API key saved securely" })
    } catch (err) {
      setGeminiMsg({ type: "error", text: err.message })
    } finally {
      setGeminiLoading(false)
    }
  }

  const removeGeminiKey = async () => {
    setGeminiLoading(true)
    try {
      await apiFetch("/auth/gemini-key", { method: "DELETE" }, token)
      setHasGeminiKey(false)
      setGeminiMsg({ type: "success", text: "Gemini API key removed" })
    } catch (err) {
      setGeminiMsg({ type: "error", text: err.message })
    } finally {
      setGeminiLoading(false)
    }
  }

  const createKey = async () => {
    setKeyLoading(true)
    try {
      const data = await apiFetch("/keys/create", {
        method: "POST",
        body: JSON.stringify({ name: keyName || "default" })
      }, token)
      setNewKey(data.key)
      setKeyName("")
      const updated = await apiFetch("/keys/list", {}, token)
      setKeys(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setKeyLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#1a1a2e", padding: "0 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>I</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>InferMesh</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#888", fontSize: 13 }}>{user?.email}</span>
            <button onClick={logout} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>Settings</h1>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: "2rem" }}>Manage your Gemini API key and InferMesh API keys</p>

        {/* Gemini Key Section */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #f0f0f0", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>Gemini API Key</h3>
            {hasGeminiKey && (
              <span style={{ background: "#e6fff6", color: "#0a7a4a", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>Connected</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#aaa", marginBottom: "1.25rem" }}>
            Your key is encrypted and stored securely. We never expose it. Get one free at{" "}
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: PURPLE }}>aistudio.google.com</a>
          </p>

          {geminiMsg && (
            <div style={{ background: geminiMsg.type === "success" ? "#f0fff8" : "#fff0f0", border: `1px solid ${geminiMsg.type === "success" ? "#b0f0d0" : "#ffd0d0"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: geminiMsg.type === "success" ? "#0a7a4a" : "#c00", marginBottom: "1rem" }}>
              {geminiMsg.text}
            </div>
          )}

          {hasGeminiKey ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, color: "#aaa", background: "#fafafa" }}>
                ••••••••••••••••••••••••••••••••
              </div>
              <button onClick={removeGeminiKey} disabled={geminiLoading} style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", border: "1px solid #ffd0d0", color: "#c00", fontSize: 13, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <input
                type="password"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, outline: "none" }}
              />
              <button onClick={saveGeminiKey} disabled={geminiLoading} style={{ padding: "10px 24px", borderRadius: 8, background: PURPLE, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                {geminiLoading ? "Saving..." : "Save key"}
              </button>
            </div>
          )}
        </div>

        {/* InferMesh API Keys Section */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #f0f0f0", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", marginBottom: 4 }}>InferMesh API Keys</h3>
          <p style={{ fontSize: 13, color: "#aaa", marginBottom: "1.25rem" }}>Use these keys in your app to route requests through InferMesh</p>

          <div style={{ display: "flex", gap: 12, marginBottom: newKey ? "1rem" : 0 }}>
            <input
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              placeholder="Key name (e.g. production, development)"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, outline: "none" }}
            />
            <button onClick={createKey} disabled={keyLoading} style={{ padding: "10px 24px", borderRadius: 8, background: PURPLE, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              {keyLoading ? "Creating..." : "Create key"}
            </button>
          </div>

          {newKey && (
            <div style={{ marginTop: "1rem", background: "#f0fff8", border: "1px solid #b0f0d0", borderRadius: 8, padding: "12px 16px" }}>
              <p style={{ fontSize: 12, color: "#0a7a4a", fontWeight: 600, marginBottom: 6 }}>Copy this key now — it won't be shown again</p>
              <code style={{ fontSize: 13, color: "#1a1a2e", wordBreak: "break-all" }}>{newKey}</code>
              <button onClick={() => navigator.clipboard.writeText(newKey)} style={{ display: "block", marginTop: 8, fontSize: 12, color: PURPLE, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                Copy to clipboard
              </button>
            </div>
          )}
        </div>

        {/* Keys List */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>Your keys</h3>
          </div>
          {keys.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>No keys yet — create one above</div>
          ) : (
            keys.map(k => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#333", margin: 0 }}>{k.name}</p>
                  <p style={{ fontSize: 12, color: "#aaa", margin: "2px 0 0", fontFamily: "monospace" }}>{k.key}</p>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{new Date(k.created_at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button onClick={() => navigate("/dashboard")} style={{ fontSize: 13, color: PURPLE, background: "transparent", border: "none", cursor: "pointer" }}>
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
