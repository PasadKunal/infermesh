import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../api"
import Layout from "../components/Layout"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const ACCENT = "#6366f1"
const GREEN = "#16a34a"
const AMBER = "#d97706"
const RED = "#dc2626"

function StatCard({ label, value, sub, children }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 20px" }}>
      <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>{label}</p>
      {children || <>
        <p style={{ color: "var(--text)", fontSize: 26, fontWeight: 600, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{value}</p>
        {sub && <p style={{ color: "var(--text-3)", fontSize: 12, margin: 0 }}>{sub}</p>}
      </>}
    </div>
  )
}

const ChartTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        {label && <p style={{ color: "var(--text-3)", fontSize: 11, margin: "0 0 4px" }}>{label}</p>}
        <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: 0 }}>{prefix}{payload[0].value}{suffix}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [costData, setCostData] = useState([])
  const [latency, setLatency] = useState(null)
  const [providers, setProviders] = useState([])
  const [rateLimit, setRateLimit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = () => {
    Promise.all([
      apiFetch("/metrics/summary", {}, token),
      apiFetch("/metrics/cost-by-day", {}, token),
      apiFetch("/metrics/latency", {}, token),
      apiFetch("/metrics/providers", {}, token),
      apiFetch("/metrics/rate-limit", {}, token)
    ]).then(([s, c, l, p, rl]) => {
      setSummary(s)
      setCostData(c)
      setLatency(l)
      setProviders(p)
      setRateLimit(rl)
      setLoading(false)
      setLastUpdated(new Date().toLocaleTimeString())
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 30000)
    return () => clearInterval(iv)
  }, [token])

  const latencyData = latency ? [
    { name: "p50", value: Math.round(latency.p50_ms) },
    { name: "p95", value: Math.round(latency.p95_ms) },
    { name: "p99", value: Math.round(latency.p99_ms) }
  ] : []

  const COLORS = [ACCENT, GREEN, AMBER, RED]
  const hasData = summary?.total_requests > 0
  const rateLimitPct = rateLimit ? Math.round((rateLimit.remaining / rateLimit.limit) * 100) : 100
  const rateLimitColor = rateLimitPct > 50 ? "var(--green)" : rateLimitPct > 20 ? "var(--amber)" : "var(--red)"

  if (loading) return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${ACCENT}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div style={{ padding: "32px 28px", maxWidth: 1200 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Overview</h1>
            <p style={{ color: "var(--text-3)", fontSize: 13, margin: "4px 0 0" }}>Updated every 30 seconds</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            <span style={{ color: "var(--text-3)", fontSize: 12 }}>Live · {lastUpdated}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
          <StatCard label="Total requests" value={(summary?.total_requests || 0).toLocaleString()} />
          <StatCard label="Total cost" value={`$${(summary?.total_cost_usd || 0).toFixed(6)}`} sub="USD" />
          <StatCard label="Avg latency" value={`${Math.round(summary?.avg_latency_ms || 0)}ms`} sub="excl. cache hits" />
          <StatCard label="Cache hit rate" value={`${summary?.cache_hit_rate || 0}%`} sub="semantic cache" />
          <StatCard label="Rate limit">
            <p style={{ color: rateLimitColor, fontSize: 26, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{rateLimit?.remaining ?? 60}/60</p>
            <div style={{ height: 3, background: "var(--bg-tertiary)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${rateLimitPct}%`, background: rateLimitColor, borderRadius: 2 }} />
            </div>
            <p style={{ color: "var(--text-3)", fontSize: 11, margin: "5px 0 0" }}>per min · {rateLimit?.key_name || "no key"}</p>
          </StatCard>
        </div>

        {!hasData ? (
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: "var(--accent-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <p style={{ color: "var(--text)", fontSize: 15, fontWeight: 500, margin: "0 0 6px" }}>No data yet</p>
            <p style={{ color: "var(--text-3)", fontSize: 13, margin: "0 0 20px" }}>Send your first request to start seeing metrics</p>
            <button onClick={() => navigate("/playground")} style={{ padding: "9px 18px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Open playground
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 20px" }}>
                <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 18px" }}>Cost over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip prefix="$" />} />
                    <Line type="monotone" dataKey="cost" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 20px" }}>
                <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 18px" }}>Latency percentiles</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={latencyData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip suffix="ms" />} cursor={{ fill: "var(--bg-tertiary)", radius: 6 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {latencyData.map((_, i) => <Cell key={i} fill={[GREEN, AMBER, RED][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 20px" }}>
              <p style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 18px" }}>Provider breakdown</p>
              <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                <PieChart width={150} height={150}>
                  <Pie data={providers} dataKey="requests" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {providers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div style={{ flex: 1 }}>
                  {providers.map((p, i) => (
                    <div key={p.provider} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                        <span style={{ fontSize: 13, color: "var(--text)", textTransform: "capitalize" }}>{p.provider}</span>
                      </div>
                      <div style={{ display: "flex", gap: 20 }}>
                        <span style={{ fontSize: 13, color: "var(--text-3)" }}>{p.requests} requests</span>
                        <span style={{ fontSize: 13, color: "var(--text-2)", minWidth: 90, textAlign: "right" }}>${p.cost.toFixed(6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  )
}
