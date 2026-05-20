import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"

const PURPLE = "#6C63FF"
const TEAL = "#00C9A7"
const CORAL = "#FF6B6B"
const AMBER = "#FFB347"
const PROVIDER_COLORS = [PURPLE, TEAL, CORAL, AMBER]

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", borderLeft: `4px solid ${accent}`, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa" }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#bbb" }}>{sub}</span>}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1a1a2e", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13 }}>
        {label && <p style={{ margin: 0, color: "#aaa", marginBottom: 4 }}>{label}</p>}
        <p style={{ margin: 0, fontWeight: 600 }}>{prefix}{payload[0].value}{suffix}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [costData, setCostData] = useState([])
  const [latency, setLatency] = useState(null)
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = () => {
    Promise.all([
      apiFetch("/metrics/summary", {}, token),
      apiFetch("/metrics/cost-by-day", {}, token),
      apiFetch("/metrics/latency", {}, token),
      apiFetch("/metrics/providers", {}, token)
    ]).then(([s, c, l, p]) => {
      setSummary(s)
      setCostData(c)
      setLatency(l)
      setProviders(p)
      setLoading(false)
      setError(false)
      setLastUpdated(new Date().toLocaleTimeString())
    }).catch(() => {
      setLoading(false)
      setError(true)
    })
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [token])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7f8fc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${PURPLE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#aaa", fontSize: 14 }}>Loading metrics...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7f8fc" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
        <p style={{ color: "#333", fontWeight: 600 }}>Could not load metrics</p>
        <button onClick={fetchData} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, background: PURPLE, color: "#fff", border: "none", cursor: "pointer" }}>Retry</button>
      </div>
    </div>
  )

  const latencyData = latency ? [
    { name: "p50", value: Math.round(latency.p50_ms) },
    { name: "p95", value: Math.round(latency.p95_ms) },
    { name: "p99", value: Math.round(latency.p99_ms) }
  ] : []

  const hasData = summary && summary.total_requests > 0

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#1a1a2e", padding: "0 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>I</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>InferMesh</span>
            <span style={{ background: "rgba(108,99,255,0.25)", color: "#a89fff", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>Gateway</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL }} />
              <span style={{ color: "#888", fontSize: 12 }}>Live · {lastUpdated}</span>
            </div>
            <span style={{ color: "#555", fontSize: 13 }}>{user?.name || user?.email}</span>
            <button onClick={() => navigate("/playground")} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Playground</button><button onClick={() => navigate("/settings")} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>API Keys</button>
            <button onClick={logout} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Overview</h1>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Your inference requests — real-time metrics</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "2rem" }}>
          <StatCard label="Total Requests" value={(summary?.total_requests || 0).toLocaleString()} accent={PURPLE} />
          <StatCard label="Total Cost" value={`$${(summary?.total_cost_usd || 0).toFixed(6)}`} sub="USD spent" accent={CORAL} />
          <StatCard label="Avg Latency" value={`${Math.round(summary?.avg_latency_ms || 0)}ms`} sub="excl. cache hits" accent={AMBER} />
          <StatCard label="Cache Hit Rate" value={`${summary?.cache_hit_rate || 0}%`} sub="semantic cache" accent={TEAL} />
        </div>

        {!hasData ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "4rem", textAlign: "center", border: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p style={{ color: "#333", fontWeight: 600, fontSize: 16 }}>No requests yet</p>
            <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Generate an API key and send your first request to see metrics here</p>
            <button onClick={() => navigate("/settings")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, background: PURPLE, color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}>Get API key</button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: "2rem" }}>
              <ChartCard title="Cost over time">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Line type="monotone" dataKey="cost" stroke={PURPLE} strokeWidth={2.5} dot={{ fill: PURPLE, r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Latency percentiles">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={latencyData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip suffix="ms" />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {latencyData.map((_, i) => <Cell key={i} fill={[TEAL, AMBER, CORAL][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Provider breakdown">
              <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
                <PieChart width={180} height={180}>
                  <Pie data={providers} dataKey="requests" nameKey="provider" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {providers.map((_, i) => <Cell key={i} fill={PROVIDER_COLORS[i % PROVIDER_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div style={{ flex: 1 }}>
                  {providers.map((p, i) => (
                    <div key={p.provider} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: PROVIDER_COLORS[i % PROVIDER_COLORS.length] }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#333", textTransform: "capitalize" }}>{p.provider}</span>
                      </div>
                      <div style={{ display: "flex", gap: 24 }}>
                        <span style={{ fontSize: 13, color: "#888" }}>{p.requests} requests</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#333", minWidth: 80, textAlign: "right" }}>${p.cost.toFixed(6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
