import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../services/api'
import { formatCurrency, debounce } from '../utils/helpers'
import StockBadge from '../components/ui/StockBadge'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { Search, Boxes, Plus, Minus, RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjustValue, setAdjustValue] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filter === 'low') params.low_stock = true
      const res = await productsApi.getAll(params)
      let data = res.data
      if (filter === 'out') data = data.filter((p) => p.quantity_in_stock === 0)
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  const debouncedSearch = useCallback(debounce((val) => setSearch(val), 400), [])

  const handleAdjust = async () => {
    if (!adjustValue || isNaN(parseInt(adjustValue))) {
      toast.error('Enter a valid adjustment value')
      return
    }
    setAdjustLoading(true)
    try {
      await productsApi.adjustStock(adjustModal.id, parseInt(adjustValue))
      toast.success(`Stock adjusted: ${adjustValue > 0 ? '+' : ''}${adjustValue} units`)
      setAdjustModal(null)
      setAdjustValue('')
      fetchProducts()
    } finally {
      setAdjustLoading(false)
    }
  }

  const allProducts = products
  const totalValue = allProducts.reduce((s, p) => s + p.price * p.quantity_in_stock, 0)
  const lowCount = allProducts.filter((p) => p.quantity_in_stock > 0 && p.quantity_in_stock <= p.reorder_level).length
  const outCount = allProducts.filter((p) => p.quantity_in_stock === 0).length

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Total SKUs</p>
          <p className="text-2xl font-bold text-white">{products.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Inventory Value</p>
          <p className="text-2xl font-bold text-brand-400">{formatCurrency(totalValue)}</p>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-400">{lowCount}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-400">{outCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input defaultValue={search} onChange={(e) => debouncedSearch(e.target.value)} placeholder="Search products..." className="input-field pl-9" />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'low', label: 'Low Stock' },
              { key: 'out', label: 'Out of Stock' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={clsx(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                  filter === key ? 'bg-brand-600/20 text-brand-400 border-brand-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white',
                )}
              >{label}</button>
            ))}
          </div>
          <button onClick={fetchProducts} className="btn-secondary px-3"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : products.length === 0 ? (
        <EmptyState icon={Boxes} title="No inventory found" description="Add products to start tracking inventory." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">SKU</th>
                  <th className="table-header">Category</th>
                  <th className="table-header text-right">Unit Price</th>
                  <th className="table-header text-center">In Stock</th>
                  <th className="table-header text-center">Reorder At</th>
                  <th className="table-header text-right">Stock Value</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell font-medium text-white">{p.name}</td>
                    <td className="table-cell font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="table-cell text-slate-400">{p.category || '—'}</td>
                    <td className="table-cell text-right">{formatCurrency(p.price)}</td>
                    <td className="table-cell text-center font-bold text-white">{p.quantity_in_stock} <span className="text-slate-500 font-normal text-xs">{p.unit}</span></td>
                    <td className="table-cell text-center text-slate-400">{p.reorder_level}</td>
                    <td className="table-cell text-right font-medium text-white">{formatCurrency(p.price * p.quantity_in_stock)}</td>
                    <td className="table-cell text-center"><StockBadge qty={p.quantity_in_stock} reorderLevel={p.reorder_level} /></td>
                    <td className="table-cell text-center">
                      <button
                        onClick={() => { setAdjustModal(p); setAdjustValue('') }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" /><Minus className="w-3 h-3" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      <Modal isOpen={Boolean(adjustModal)} onClose={() => setAdjustModal(null)} title="Adjust Stock" size="sm">
        {adjustModal && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
              <p className="text-sm font-medium text-white">{adjustModal.name}</p>
              <p className="text-xs text-slate-500 font-mono">{adjustModal.sku}</p>
              <p className="text-lg font-bold text-brand-400 mt-2">Current: {adjustModal.quantity_in_stock} {adjustModal.unit}</p>
            </div>
            <div>
              <label className="label">Adjustment (positive = add, negative = remove)</label>
              <input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="e.g. 50 or -10"
                className="input-field"
                autoFocus
              />
              {adjustValue && !isNaN(parseInt(adjustValue)) && (
                <p className="text-xs text-slate-400 mt-1">
                  New quantity: <span className={clsx('font-semibold', adjustModal.quantity_in_stock + parseInt(adjustValue) < 0 ? 'text-red-400' : 'text-green-400')}>
                    {adjustModal.quantity_in_stock + parseInt(adjustValue)} {adjustModal.unit}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAdjustModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdjust} disabled={adjustLoading} className="btn-primary disabled:opacity-60">
                {adjustLoading ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
