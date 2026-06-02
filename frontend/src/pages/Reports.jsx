import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import { formatCurrency } from '../utils/helpers'
import { PageLoader } from '../components/ui/Spinner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart2, TrendingUp, Package, ShoppingCart } from 'lucide-react'

const PIE_COLORS = ['#f59e0b', '#6366f1', '#a855f7', '#06b6d4', '#22c55e', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getRevenueChart(days),
      dashboardApi.getTopProducts(),
      dashboardApi.getOrderStatusDistribution(),
    ]).then(([s, chart, tp, sd]) => {
      setSummary(s.data)
      setChartData(chart.data)
      setTopProducts(tp.data)
      setStatusDist(sd.data)
    }).finally(() => setLoading(false))
  }, [days])

  if (loading) return <PageLoader />

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Business analytics and performance insights</p>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                days === d ? 'bg-brand-600/20 text-brand-400 border-brand-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >{d}d</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', val: formatCurrency(summary?.total_revenue), icon: TrendingUp, color: 'text-brand-400' },
          { label: 'Total Orders', val: summary?.total_orders ?? 0, icon: ShoppingCart, color: 'text-cyan-400' },
          { label: 'Total Products', val: summary?.total_products ?? 0, icon: Package, color: 'text-purple-400' },
          { label: 'Inventory Value', val: formatCurrency(summary?.inventory_value), icon: BarChart2, color: 'text-emerald-400' },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Revenue Trend</h3>
        <p className="text-xs text-slate-500 mb-6">Last {days} days</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Top Selling Products</h3>
          <p className="text-xs text-slate-500 mb-6">By units sold</p>
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="product_name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total_sold" name="Units Sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Order Status Distribution</h3>
          <p className="text-xs text-slate-500 mb-6">All time</p>
          {statusDist.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={90} paddingAngle={3}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs text-slate-400 capitalize">{v}</span>} />
                <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Product revenue table */}
      {topProducts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Product Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="table-header">#</th>
                  <th className="table-header">Product</th>
                  <th className="table-header">SKU</th>
                  <th className="table-header text-right">Units Sold</th>
                  <th className="table-header text-right">Revenue</th>
                  <th className="table-header">Share</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const totalRev = topProducts.reduce((s, t) => s + t.total_revenue, 0)
                  const pct = totalRev > 0 ? ((p.total_revenue / totalRev) * 100).toFixed(1) : 0
                  return (
                    <tr key={p.product_sku} className="table-row">
                      <td className="table-cell text-slate-500">#{i + 1}</td>
                      <td className="table-cell font-medium text-white">{p.product_name}</td>
                      <td className="table-cell font-mono text-xs text-slate-400">{p.product_sku}</td>
                      <td className="table-cell text-right">{p.total_sold}</td>
                      <td className="table-cell text-right font-semibold text-brand-400">{formatCurrency(p.total_revenue)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
