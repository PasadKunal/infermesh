import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"

const ACCENT = "#5865f2"
const GREEN = "#22c55e"

export default function Settings() {
  const { token } = useAuth()
  const [keys, setKeys] = useState([])
  const [keyName, setKeyName] = useState("")
  const [newKey, setNewKey] = useState(null)
  const [keyLoading, setKeyLoading] = useState(false)
  const [geminiKey, setGeminiKey] = useState("")
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiFetch("/keys/list", {}, token).then(setKeys).catch(console.error)
    apiFetch("/auth/gemini-key", {}, token).then(d => setHasGeminiKey(d.has_key)).catch(console.error)
  }, [token])

  const saveGeminiKey = async () => {
    if (!geminiKey.trim()) return
    setGeminiLoading(true)
    setGeminiMsg(null)
    try {
      await apiFetch("/auth/gemini-key", { method: "PUT", body: JSON.stringify({ gemini_api_key: geminiKey }) }, token)
      setHasGeminiKey(true)
      setGeminiKey("")
      setGeminiMsg({ type: "success", text: "Gemini API key saved and encrypted" })
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
      const data = await apiFetch("/keys/create", { method: "POST", body: JSON.stringify({ name: keyName || "default" }) }, token)
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

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = { flex: 1, padding: "10px 14px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none" }

  return (
    <Layout>
      <div style={{ padding: "32px 36px", maxWidth: 800 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Settings</h1>
          <p style={{ color: "#555", fontSize: 13, margin: "4px 0 0" }}>Manage your API keys and integrations</p>
        </div>

        <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 500, margin: 0 }}>Gemini API key</h2>
              {hasGeminiKey && (
                <span style={{ background: "#0d2010", border: "1px solid #22c55e33", color: GREEN, fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>Connected</span>
              )}
            </div>
          </div>
          <p style={{ color: "#555", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
            Your key is encrypted at rest and never exposed. Get one free at{" "}
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: ACCENT, textDecoration: "none" }}>aistudio.google.com</a>
          </p>

          {geminiMsg && (
            <div style={{ background: geminiMsg.type === "success" ? "#0d2010" : "#1a0a0a", border: `1px solid ${geminiMsg.type === "success" ? "#22c55e33" : "#3a1a1a"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: geminiMsg.type === "success" ? GREEN : "#f87171", marginBottom: 16 }}>
              {geminiMsg.text}
            </div>
          )}

          {hasGeminiKey ? (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ ...inputStyle, flex: 1, color: "#444", userSelect: "none" }}>AIza••••••••••••••••••••••••••••••••</div>
              <button onClick={removeGeminiKey} disabled={geminiLoading} style={{ padding: "10px 18px", background: "transparent", border: "1px solid #3a1a1a", color: "#f87171", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIza..." style={inputStyle} />
              <button onClick={saveGeminiKey} disabled={geminiLoading} style={{ padding: "10px 20px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                {geminiLoading ? "Saving..." : "Save key"}
              </button>
            </div>
          )}
        </div>

        <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 500, margin: "0 0 6px" }}>InferMesh API keys</h2>
          <p style={{ color: "#555", fontSize: 13, margin: "0 0 20px" }}>Use these keys in your application to route requests through InferMesh</p>

          <div style={{ display: "flex", gap: 10, marginBottom: newKey ? 16 : 0 }}>
            <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Key name (e.g. production, staging)" style={inputStyle} />
            <button onClick={createKey} disabled={keyLoading} style={{ padding: "10px 20px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
              {keyLoading ? "Creating..." : "Create key"}
            </button>
          </div>

          {newKey && (
            <div style={{ background: "#0d2010", border: "1px solid #22c55e22", borderRadius: 8, padding: "14px 16px" }}>
              <p style={{ color: GREEN, fontSize: 12, fontWeight: 500, margin: "0 0 8px" }}>Copy this key now. It will not be shown again.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <code style={{ flex: 1, fontSize: 12, color: "#ccc", fontFamily: "monospace", wordBreak: "break-all" }}>{newKey}</code>
                <button onClick={() => copyKey(newKey)} style={{ padding: "6px 14px", background: "#0f3020", border: "1px solid #22c55e33", color: GREEN, borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {keys.length > 0 && (
          <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 28px", borderBottom: "1px solid #1a1a1a" }}>
              <h3 style={{ color: "#888", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Active keys</h3>
            </div>
            {keys.map((k, i) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: i < keys.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                <div>
                  <p style={{ color: "#ccc", fontSize: 13, fontWeight: 500, margin: 0 }}>{k.name}</p>
                  <code style={{ color: "#444", fontSize: 12, fontFamily: "monospace" }}>{k.key}</code>
                </div>
                <span style={{ color: "#444", fontSize: 12 }}>{new Date(k.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
