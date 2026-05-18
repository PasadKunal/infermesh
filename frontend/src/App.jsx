import { useState, useEffect } from "react"
import axios from "axios"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const API = "http://localhost:8000"

const COLORS = ["#534AB7", "#1D9E75", "#D85A30", "#BA7517"]

function MetricCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#f8f8f8",
      borderRadius: 10,
      padding: "1.25rem 1.5rem",
      border: "0.5px solid #e0e0e0"
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500, color: "#1a1a1a" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function App() {
  const [summary, setSummary] = useState(null)
  const [costData, setCostData] = useState([])
  const [latency, setLatency] = useState(null)
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    })
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ color: "#888" }}>Loading...</p>
    </div>
  )

  const latencyData = latency ? [
    { name: "p50", value: latency.p50_ms },
    { name: "p95", value: latency.p95_ms },
    { name: "p99", value: latency.p99_ms }
  ] : []

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>InferMesh</h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>LLM Inference Gateway - Live Metrics</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "2.5rem" }}>
        <MetricCard
          label="Total Requests"
          value={summary.total_requests}
        />
        <MetricCard
          label="Total Cost"
          value={`$${summary.total_cost_usd.toFixed(6)}`}
          sub="USD"
        />
        <MetricCard
          label="Avg Latency"
          value={`${summary.avg_latency_ms.toFixed(0)}ms`}
          sub="excluding cache hits"
        />
        <MetricCard
          label="Cache Hit Rate"
          value={`${summary.cache_hit_rate}%`}
          sub="semantic cache"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: "2rem" }}>

        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 10, padding: "1.25rem" }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "#444", marginBottom: 16 }}>Cost over time (USD)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${v.toFixed(6)}`, "Cost"]} />
              <Line type="monotone" dataKey="cost" stroke="#534AB7" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 10, padding: "1.25rem" }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "#444", marginBottom: 16 }}>Latency percentiles (ms)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}ms`, "Latency"]} />
              <Bar dataKey="value" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 10, padding: "1.25rem" }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "#444", marginBottom: 16 }}>Requests by provider</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <PieChart width={200} height={200}>
            <Pie
              data={providers}
              dataKey="requests"
              nameKey="provider"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {providers.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
          <div>
            {providers.map((p, i) => (
              <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: 13, color: "#444" }}>{p.provider}</span>
                <span style={{ fontSize: 13, color: "#888" }}>{p.requests} requests</span>
                <span style={{ fontSize: 13, color: "#aaa" }}>${p.cost.toFixed(6)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
