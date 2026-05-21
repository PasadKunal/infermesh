import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"

function EyeIcon({ open }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
  )
}

function ProviderCard({ title, subtitle, field, placeholder, token, docsUrl }) {
  const [hasKey, setHasKey] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const maskedValue = "••••••••••••••••••••••••••••••••••••••••"

  useEffect(() => {
    apiFetch(`/auth/${field}`, {}, token)
      .then(d => setHasKey(d.has_key))
      .catch(console.error)
  }, [token, field])

  const save = async () => {
    if (!value.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      await apiFetch(`/auth/${field}`, { method: "PUT", body: JSON.stringify({ api_key: value }) }, token)
      setHasKey(true)
      setValue("")
      setEditing(false)
      setMsg({ ok: true, text: "Key saved and encrypted" })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Remove ${title} API key?`)) return
    setLoading(true)
    try {
      await apiFetch(`/auth/${field}`, { method: "DELETE" }, token)
      setHasKey(false)
      setEditing(false)
      setMsg({ ok: true, text: "Key removed" })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ color: "var(--text)", fontWeight: 500, fontSize: 14 }}>{title}</p>
              {hasKey && (
                <span style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", fontSize: 11, padding: "1px 8px", borderRadius: 20, fontWeight: 500 }}>Connected</span>
              )}
            </div>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 1 }}>{subtitle}</p>
          </div>
        </div>
        <a href={docsUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          Get key
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px", background: "var(--bg-tertiary)" }}>
        {msg && (
          <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: msg.ok ? "var(--green-bg)" : "var(--red-bg)", border: `1px solid ${msg.ok ? "var(--green-border)" : "var(--red-border)"}`, color: msg.ok ? "var(--green)" : "var(--red)", fontSize: 12 }}>
            {msg.text}
          </div>
        )}

        {!hasKey && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add key
          </button>
        )}

        {hasKey && !editing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-2)", flex: 1 }}>
                {revealed ? `${placeholder.slice(0, 8)}...` : maskedValue}
              </span>
              <button onClick={() => setRevealed(r => !r)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, display: "flex" }}>
                <EyeIcon open={revealed} />
              </button>
            </div>
            <button onClick={() => setEditing(true)} style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Update
            </button>
            <button onClick={remove} disabled={loading} style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--red-border)", color: "var(--red)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        )}

        {editing && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="password"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && save()}
                placeholder={placeholder}
                autoFocus
                style={{ flex: 1, padding: "8px 12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none", fontFamily: "monospace" }}
              />
              <button onClick={save} disabled={loading || !value.trim()} style={{ padding: "8px 16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: loading || !value.trim() ? 0.6 : 1 }}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setValue("") }} style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
            <p style={{ color: "var(--text-3)", fontSize: 11 }}>
              Your key is encrypted with AES-256 before storage. We never log or expose it.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const { token } = useAuth()
  const [keys, setKeys] = useState([])
  const [keyName, setKeyName] = useState("")
  const [newKey, setNewKey] = useState(null)
  const [keyLoading, setKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiFetch("/keys/list", {}, token).then(setKeys).catch(console.error)
  }, [token])

  const createKey = async () => {
    if (keyLoading) return
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

  const deleteKey = async (id) => {
    if (!confirm("Delete this API key?")) return
    try {
      await apiFetch(`/keys/${id}`, { method: "DELETE" }, token)
      setKeys(k => k.filter(key => key.id !== id))
      if (newKey) setNewKey(null)
    } catch (err) {
      console.error(err)
    }
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>Settings</h1>
          <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>Manage provider integrations and access keys</p>
        </div>

        <div style={{ marginBottom: 8 }}>
          <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Provider API keys</p>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
            InferMesh routes requests to the cheapest available provider. Add multiple providers to enable automatic failover.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <ProviderCard
            title="Gemini"
            subtitle="Google AI Studio - free tier available"
            field="gemini-key"
            placeholder="AIzaSy..."
            token={token}
            docsUrl="https://aistudio.google.com/app/apikey"
          />
          <ProviderCard
            title="OpenAI"
            subtitle="GPT-4o, GPT-4o-mini and more"
            field="openai-key"
            placeholder="sk-proj-..."
            token={token}
            docsUrl="https://platform.openai.com/api-keys"
          />
          <ProviderCard
            title="Anthropic"
            subtitle="Claude Opus, Sonnet, Haiku and more"
            field="anthropic-key"
            placeholder="sk-ant-..."
            token={token}
            docsUrl="https://console.anthropic.com/settings/keys"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>InferMesh API keys</p>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
            Use these keys in the <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace" }}>x-api-key</code> header when calling the gateway.
          </p>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "14px 20px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createKey()}
                placeholder="Key name (e.g. production, development)"
                style={{ flex: 1, padding: "8px 12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none" }}
              />
              <button
                onClick={createKey}
                disabled={keyLoading}
                style={{ padding: "8px 16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: keyLoading ? 0.6 : 1, whiteSpace: "nowrap" }}
              >
                {keyLoading ? "Creating..." : "Create key"}
              </button>
            </div>
          </div>

          {newKey && (
            <div style={{ padding: "14px 20px", background: "var(--green-bg)", borderBottom: "1px solid var(--green-border)" }}>
              <p style={{ color: "var(--green)", fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                Copy this key now. It will not be shown again.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card-bg)", border: "1px solid var(--green-border)", borderRadius: 8, padding: "8px 12px" }}>
                <code style={{ flex: 1, fontFamily: "monospace", fontSize: 12, color: "var(--text)", wordBreak: "break-all" }}>{newKey}</code>
                <button
                  onClick={() => copy(newKey)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "transparent", border: "1px solid var(--green-border)", color: "var(--green)", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {keys.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No keys yet. Create one above.
            </div>
          ) : (
            keys.map((k, i) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  <div>
                    <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 500 }}>{k.name}</p>
                    <code style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "monospace" }}>{k.key}</code>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--text-3)", fontSize: 12 }}>{new Date(k.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => deleteKey(k.id)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
