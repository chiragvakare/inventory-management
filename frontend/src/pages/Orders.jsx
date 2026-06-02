import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../services/api'
import { formatCurrency, formatDateTime, statusColors, debounce } from '../utils/helpers'
import OrderModal from '../components/modals/OrderModal'
import OrderDetailModal from '../components/modals/OrderDetailModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import { Plus, Search, ShoppingCart, Eye, Trash2, RefreshCw, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
const PAYMENT_OPTIONS = ['', 'unpaid', 'partial', 'paid']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (paymentFilter) params.payment_status = paymentFilter
      const res = await ordersApi.getAll(params)
      setOrders(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, paymentFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  const debouncedSearch = useCallback(debounce((val) => setSearch(val), 400), [])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await ordersApi.delete(deleteTarget.id)
      toast.success('Order cancelled and stock restored')
      setDeleteTarget(null)
      fetchOrders()
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersApi.update(orderId, { status: newStatus })
      toast.success(`Order marked as ${newStatus}`)
      if (detailOrder?.id === orderId) {
        const res = await ordersApi.getById(orderId)
        setDetailOrder(res.data)
      }
      fetchOrders()
    } catch {}
  }

  const statusCounts = STATUS_OPTIONS.slice(1).reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {})
  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0)

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Revenue (shown)</p>
          <p className="text-2xl font-bold text-brand-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{statusCounts.pending || 0}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Delivered</p>
          <p className="text-2xl font-bold text-green-400">{statusCounts.delivered || 0}</p>
        </div>
      </div>

      {/* Status quick-filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize border',
              statusFilter === s
                ? s ? statusColors[s] : 'bg-brand-600/20 text-brand-400 border-brand-500/30'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white',
            )}
          >
            {s || 'All'} {s && statusCounts[s] !== undefined ? `(${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input defaultValue={search} onChange={(e) => debouncedSearch(e.target.value)} placeholder="Search by order number..." className="input-field pl-9" />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-field sm:w-44">
            <option value="">All Payments</option>
            {PAYMENT_OPTIONS.slice(1).map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
          </select>
          <button onClick={fetchOrders} className="btn-secondary px-3"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" />New Order
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders found" description="Create your first order to start tracking sales." action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />New Order</button>} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="table-header">Order #</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Items</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header">Date</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="table-row cursor-pointer" onClick={() => setDetailOrder(o)}>
                    <td className="table-cell font-mono text-xs text-brand-400 font-medium">{o.order_number}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                          {(o.customer?.full_name || 'W').charAt(0)}
                        </div>
                        <span className="text-white">{o.customer?.full_name || 'Walk-in'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-400">{o.items?.length ?? 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td className="table-cell">
                      <span className={clsx('status-badge', statusColors[o.status])}>{o.status}</span>
                    </td>
                    <td className="table-cell">
                      <span className={clsx('status-badge', statusColors[o.payment_status])}>{o.payment_status}</span>
                    </td>
                    <td className="table-cell text-right font-semibold text-white">{formatCurrency(o.total_amount)}</td>
                    <td className="table-cell text-slate-400 text-xs">{formatDateTime(o.created_at)}</td>
                    <td className="table-cell text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailOrder(o)} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTarget(o)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <OrderModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSaved={fetchOrders} />
      <OrderDetailModal isOpen={Boolean(detailOrder)} onClose={() => setDetailOrder(null)} order={detailOrder} onStatusChange={handleStatusChange} />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Cancel Order"
        message={`Cancel order "${deleteTarget?.order_number}"? Stock will be restored automatically.`}
        confirmLabel="Cancel Order"
      />
    </div>
  )
}
