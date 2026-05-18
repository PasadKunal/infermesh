import { useState, useEffect } from "react"
import axios from "axios"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"

const API = "http://localhost:8000"
const PURPLE = "#6C63FF"
const TEAL = "#00C9A7"
const CORAL = "#FF6B6B"
const AMBER = "#FFB347"

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 16,
      padding: "1.5rem",
      border: "1px solid #f0f0f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      borderLeft: `4px solid ${accent}`,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa" }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#bbb" }}>{sub}</span>}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 16,
      padding: "1.5rem",
      border: "1px solid #f0f0f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 20, letterSpacing: "0.04em", textTransform: "uppercase" }}>{title}</p>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1a1a2e", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13 }}>
        <p style={{ margin: 0, color: "#aaa", marginBottom: 4 }}>{label}</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{prefix}{payload[0].value}{suffix}</p>
      </div>
    )
  }
  return null
}

export default function App() {
  const [summary, setSummary] = useState(null)
  const [costData, setCostData] = useState([])
  const [latency, setLatency] = useState(null)
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = () => {
    Promise.all([
      axios.get(`${API}/metrics/summary`),
      axios.get(`${API}/metrics/cost-by-day`),
      axios.get(`${API}/metrics/latency`),
      axios.get(`${API}/metrics/providers`)
    ]).then(([s, c, l, p]) => {
      setSummary(s.data)
      setCostData(c.data)
      setLatency(l.data)
      setProviders(p.data)
      setLoading(false)
      setLastUpdated(new Date().toLocaleTimeString())
    })
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7f8fc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${PURPLE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#aaa", fontSize: 14 }}>Loading metrics...</p>
      </div>
    </div>
  )

  const latencyData = latency ? [
    { name: "p50", value: Math.round(latency.p50_ms) },
    { name: "p95", value: Math.round(latency.p95_ms) },
    { name: "p99", value: Math.round(latency.p99_ms) }
  ] : []

  const PROVIDER_COLORS = [PURPLE, TEAL, CORAL, AMBER]

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "'Inter', system-ui, sans-serif" }}>

      <div style={{ background: "#1a1a2e", padding: "0 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>I</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" }}>InferMesh</span>
            <span style={{ background: "rgba(108,99,255,0.25)", color: "#a89fff", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>Gateway</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, boxShadow: `0 0 6px ${TEAL}` }} />
            <span style={{ color: "#888", fontSize: 12 }}>Live · updated {lastUpdated}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 2rem" }}>

        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Overview</h1>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Real-time metrics across all inference requests</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "2rem" }}>
          <StatCard label="Total Requests" value={summary.total_requests.toLocaleString()} accent={PURPLE} />
          <StatCard label="Total Cost" value={`$${summary.total_cost_usd.toFixed(6)}`} sub="USD spent" accent={CORAL} />
          <StatCard label="Avg Latency" value={`${Math.round(summary.avg_latency_ms)}ms`} sub="excl. cache hits" accent={AMBER} />
          <StatCard label="Cache Hit Rate" value={`${summary.cache_hit_rate}%`} sub="semantic cache" accent={TEAL} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: "2rem" }}>

          <ChartCard title="Cost over time">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={costData}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Line type="monotone" dataKey="cost" stroke={PURPLE} strokeWidth={2.5} dot={{ fill: PURPLE, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
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
                  {latencyData.map((_, i) => (
                    <Cell key={i} fill={[TEAL, AMBER, CORAL][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        <ChartCard title="Provider breakdown">
          <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
            <PieChart width={180} height={180}>
              <Pie data={providers} dataKey="requests" nameKey="provider" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {providers.map((_, i) => (
                  <Cell key={i} fill={PROVIDER_COLORS[i % PROVIDER_COLORS.length]} />
                ))}
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

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}