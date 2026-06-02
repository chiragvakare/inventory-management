import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '../services/api'
import { formatCurrency, debounce } from '../utils/helpers'
import ProductModal from '../components/modals/ProductModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StockBadge from '../components/ui/StockBadge'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import {
  Plus, Search, Filter, Edit2, Trash2, Package,
  RefreshCw, Grid3X3, List, Tag, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const urlSearch = searchParams.get('search') || ''
  const [search, setSearch] = useState(urlSearch)
  const [inputVal, setInputVal] = useState(urlSearch)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [viewMode, setViewMode] = useState('table')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Sync search state when URL param changes (e.g. cleared from header)
  useEffect(() => {
    const s = searchParams.get('search') || ''
    setSearch(s)
    setInputVal(s)
  }, [searchParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (selectedCategory) params.category = selectedCategory
      if (lowStockOnly) params.low_stock = true
      const res = await productsApi.getAll(params)
      setProducts(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, lowStockOnly])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    productsApi.getCategories().then((r) => setCategories(r.data))
  }, [])

  const debouncedSearch = useCallback(
    debounce((val) => {
      setSearch(val)
      if (val) setSearchParams({ search: val })
      else setSearchParams({})
    }, 400),
    [],
  )

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputVal(val)
    debouncedSearch(val)
  }

  const handleClearSearch = () => {
    setInputVal('')
    setSearch('')
    setSearchParams({})
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await productsApi.delete(deleteTarget.id)
      toast.success('Product deleted')
      setDeleteTarget(null)
      fetchProducts()
    } finally {
      setDeleteLoading(false)
    }
  }

  const lowStockCount = products.filter((p) => p.quantity_in_stock <= p.reorder_level && p.quantity_in_stock > 0).length
  const outOfStockCount = products.filter((p) => p.quantity_in_stock === 0).length

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', val: products.length, color: 'text-white' },
          { label: 'Categories', val: categories.length, color: 'text-brand-400' },
          { label: 'Low Stock', val: lowStockCount, color: 'text-yellow-400' },
          { label: 'Out of Stock', val: outOfStockCount, color: 'text-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={clsx('text-2xl font-bold', color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={inputVal}
              onChange={handleInputChange}
              placeholder="Search by name, SKU, or category..."
              className="input-field pl-9 pr-8"
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
              lowStockOnly
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white',
            )}
          >
            <Filter className="w-4 h-4" />
            Low Stock
          </button>
          <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('table')} className={clsx('p-2.5 transition-colors', viewMode === 'table' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white')}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={clsx('p-2.5 transition-colors', viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white')}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <button onClick={fetchProducts} className="btn-secondary px-3"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditProduct(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" />Add Product
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? <PageLoader /> : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Start by adding your first product to the catalog." action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Product</button>} />
      ) : viewMode === 'table' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">SKU</th>
                  <th className="table-header">Category</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-right">Cost</th>
                  <th className="table-header text-center">Stock</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-slate-800" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none' }} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="table-cell">
                      {p.category ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg">
                          <Tag className="w-3 h-3" />{p.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-cell text-right font-medium text-white">{formatCurrency(p.price)}</td>
                    <td className="table-cell text-right text-slate-400">{p.cost_price ? formatCurrency(p.cost_price) : '—'}</td>
                    <td className="table-cell text-center">
                      <StockBadge qty={p.quantity_in_stock} reorderLevel={p.reorder_level} />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditProduct(p); setModalOpen(true) }} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
            {search && <span className="ml-2 text-brand-400">— filtered by "{search}" <button onClick={handleClearSearch} className="underline hover:text-white ml-1">Clear</button></span>}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="glass-card-hover p-5 group">
              <div className="flex items-start justify-between mb-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-800" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditProduct(p); setModalOpen(true) }} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-white text-sm mb-0.5 truncate">{p.name}</h3>
              <p className="text-xs text-slate-500 font-mono mb-2">{p.sku}</p>
              {p.category && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg mb-3"><Tag className="w-3 h-3" />{p.category}</span>}
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <p className="text-lg font-bold text-white">{formatCurrency(p.price)}</p>
                  {p.cost_price && <p className="text-xs text-slate-500">Cost: {formatCurrency(p.cost_price)}</p>}
                </div>
                <StockBadge qty={p.quantity_in_stock} reorderLevel={p.reorder_level} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditProduct(null) }} onSaved={fetchProducts} product={editProduct} />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
