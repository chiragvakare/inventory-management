import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import { formatCurrency, formatDateTime, statusColors } from '../utils/helpers'
import { PageLoader } from '../components/ui/Spinner'
import {
  Package, Users, ShoppingCart, TrendingUp, AlertTriangle,
  ArrowUp, ArrowDown, DollarSign, Boxes, Activity, BarChart2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

const PIE_COLORS = ['#f59e0b', '#6366f1', '#a855f7', '#06b6d4', '#22c55e', '#ef4444']

function StatCard({ title, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="stat-card">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-8 translate-x-8 ${color}`} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={clsx('flex items-center gap-1 mt-3 text-xs font-medium', trend >= 0 ? 'text-green-400' : 'text-red-400')}>
          {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}% from last period
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
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

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getLowStock(),
      dashboardApi.getRecentOrders(),
      dashboardApi.getRevenueChart(7),
      dashboardApi.getTopProducts(),
      dashboardApi.getOrderStatusDistribution(),
    ]).then(([s, ls, ro, chart, tp, sd]) => {
      setSummary(s.data)
      setLowStock(ls.data)
      setRecentOrders(ro.data)
      setChartData(chart.data)
      setTopProducts(tp.data)
      setStatusDist(sd.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(summary?.total_revenue)} icon={DollarSign} color="bg-brand-500" sub={`Today: ${formatCurrency(summary?.today_revenue)}`} />
        <StatCard title="Total Products" value={summary?.total_products ?? 0} icon={Package} color="bg-purple-500" sub={`${summary?.low_stock_count ?? 0} low stock`} />
        <StatCard title="Total Customers" value={summary?.total_customers ?? 0} icon={Users} color="bg-cyan-500" />
        <StatCard title="Total Orders" value={summary?.total_orders ?? 0} icon={ShoppingCart} color="bg-emerald-500" sub={`${summary?.pending_orders ?? 0} pending`} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Inventory Value', val: formatCurrency(summary?.inventory_value), icon: Boxes, col: 'text-amber-400' },
          { label: 'Out of Stock', val: summary?.out_of_stock_count ?? 0, icon: AlertTriangle, col: 'text-red-400' },
          { label: 'Pending Orders', val: summary?.pending_orders ?? 0, icon: Activity, col: 'text-yellow-400' },
          { label: 'Shipped Orders', val: summary?.shipped_orders ?? 0, icon: TrendingUp, col: 'text-green-400' },
        ].map(({ label, val, icon: Icon, col }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <Icon className={clsx('w-5 h-5 flex-shrink-0', col)} />
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-white">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <BarChart2 className="w-4 h-4 text-slate-500" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#a855f7" strokeWidth={2} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Order Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribution</p>
            </div>
          </div>
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={70} paddingAngle={3}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs text-slate-400 capitalize">{v}</span>} />
                <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">No orders yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Low Stock Alert</h3>
            </div>
            <Link to="/inventory" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">All products are well-stocked</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={clsx('text-sm font-bold', p.quantity_in_stock === 0 ? 'text-red-400' : 'text-yellow-400')}>
                      {p.quantity_in_stock === 0 ? 'Out of stock' : `${p.quantity_in_stock} left`}
                    </p>
                    <p className="text-xs text-slate-500">Reorder at {p.reorder_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
                  <div>
                    <p className="text-sm font-medium text-white font-mono">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{o.customer}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={clsx('status-badge', statusColors[o.status])}>{o.status}</span>
                    <span className="text-sm font-semibold text-white">{formatCurrency(o.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="product_name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total_sold" name="Units Sold" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
