import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { ordersApi, productsApi, customersApi } from '../../services/api'
import { Plus, Trash2, Search } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const emptyItem = { product_id: '', quantity: 1 }

export default function OrderModal({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer_id: '', discount: '', tax: '', payment_method: '', notes: '', shipping_address: '',
  })
  const [items, setItems] = useState([{ ...emptyItem }])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm({ customer_id: '', discount: '', tax: '', payment_method: '', notes: '', shipping_address: '' })
      setItems([{ ...emptyItem }])
      setErrors({})
      productsApi.getAll({ limit: 200 }).then((r) => setProducts(r.data))
      customersApi.getAll({ limit: 200 }).then((r) => setCustomers(r.data))
    }
  }, [isOpen])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  const getProduct = (id) => products.find((p) => p.id === parseInt(id))

  const addItem = () => setItems((p) => [...p, { ...emptyItem }])
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i))

  const updateItem = (i, field, value) => {
    setItems((p) => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
    if (errors[`item_${i}`]) setErrors((p) => { const n = { ...p }; delete n[`item_${i}`]; return n })
  }

  const calcSubtotal = () => items.reduce((sum, item) => {
    const p = getProduct(item.product_id)
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0)
  }, 0)

  const discount = parseFloat(form.discount) || 0
  const taxPct = parseFloat(form.tax) || 0
  const subtotal = calcSubtotal()
  const taxAmt = subtotal * taxPct / 100
  const total = subtotal - discount + taxAmt

  const validate = () => {
    const e = {}
    const hasItems = items.some((i) => i.product_id && parseInt(i.quantity) > 0)
    if (!hasItems) e.items = 'Add at least one product with quantity > 0'
    items.forEach((item, idx) => {
      if (item.product_id && item.quantity) {
        const p = getProduct(item.product_id)
        if (p && parseInt(item.quantity) > p.quantity_in_stock) {
          e[`item_${idx}`] = `Only ${p.quantity_in_stock} ${p.unit} available`
        }
      }
    })
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        customer_id: form.customer_id ? parseInt(form.customer_id) : null,
        items: items
          .filter((i) => i.product_id && parseInt(i.quantity) > 0)
          .map((i) => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
        discount,
        tax: taxPct,
        payment_method: form.payment_method || null,
        notes: form.notes || null,
        shipping_address: form.shipping_address || null,
      }
      await ordersApi.create(payload)
      toast.success('Order created successfully!')
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Customer</label>
            <select name="customer_id" value={form.customer_id} onChange={(e) => setForm((p) => ({ ...p, customer_id: e.target.value }))} className="input-field">
              <option value="">Walk-in Customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} className="input-field">
              <option value="">Select method</option>
              {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Order Items *</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Filter products..."
                className="pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 w-44"
              />
            </div>
          </div>

          {errors.items && <p className="text-red-400 text-xs mb-2">{errors.items}</p>}

          <div className="space-y-2">
            {items.map((item, idx) => {
              const prod = getProduct(item.product_id)
              return (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select product</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                          {p.name} — ₹{p.price} (Stock: {p.quantity_in_stock} {p.unit})
                        </option>
                      ))}
                    </select>
                    {errors[`item_${idx}`] && <p className="text-red-400 text-xs mt-0.5">{errors[`item_${idx}`]}</p>}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      max={prod?.quantity_in_stock}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="input-field"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-28 flex items-center">
                    <span className="text-sm text-slate-400 px-2 py-2.5">
                      {prod ? formatCurrency(prod.price * (parseInt(item.quantity) || 0)) : '—'}
                    </span>
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="p-2.5 text-slate-500 hover:text-red-400 transition-colors" disabled={items.length === 1}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add another product
          </button>
        </div>

        {/* Discount, Tax, Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Discount (₹)</label>
            <input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))} placeholder="0.00" className="input-field" />
          </div>
          <div>
            <label className="label">Tax (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={form.tax} onChange={(e) => setForm((p) => ({ ...p, tax: e.target.value }))} placeholder="0" className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Shipping Address</label>
          <textarea value={form.shipping_address} onChange={(e) => setForm((p) => ({ ...p, shipping_address: e.target.value }))} rows={2} placeholder="Delivery address..." className="input-field resize-none" />
        </div>
        <div>
          <label className="label">Order Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Any special instructions..." className="input-field resize-none" />
        </div>

        {/* Order Summary */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>Discount</span><span className="text-red-400">- {formatCurrency(discount)}</span>
            </div>
          )}
          {taxPct > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>Tax ({taxPct}%)</span><span className="text-white">{formatCurrency(taxAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-slate-700 pt-2 mt-2">
            <span className="text-white">Total Amount</span>
            <span className="text-brand-400 text-base">{formatCurrency(Math.max(0, total))}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
