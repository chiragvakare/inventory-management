import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { productsApi } from '../../services/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Furniture', 'Books', 'Toys', 'Health & Beauty', 'Sports', 'Automotive', 'Other']
const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'pair', 'set', 'roll']

// Only letters, numbers, spaces, hyphens, apostrophes, dots, & and /
const SAFE_TEXT = /^[a-zA-Z0-9 \-'.,&/()]+$/
// SKU: letters, numbers, hyphens and underscores only
const SAFE_SKU = /^[a-zA-Z0-9\-_]+$/
// URL pattern
const URL_PATTERN = /^https?:\/\/.+/

const empty = {
  name: '', sku: '', description: '', category: '', price: '', cost_price: '',
  quantity_in_stock: '', reorder_level: '10', unit: 'pcs', image_url: '',
}

export default function ProductModal({ isOpen, onClose, onSaved, product }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = Boolean(product)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || '',
        price: String(product.price ?? ''),
        cost_price: String(product.cost_price ?? ''),
        quantity_in_stock: String(product.quantity_in_stock ?? ''),
        reorder_level: String(product.reorder_level ?? '10'),
        unit: product.unit || 'pcs',
        image_url: product.image_url || '',
      })
    } else {
      setForm(empty)
    }
    setErrors({})
  }, [product, isOpen])

  const validate = () => {
    const e = {}

    // Name
    if (!form.name.trim()) {
      e.name = 'Product name is required'
    } else if (form.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters'
    } else if (form.name.trim().length > 200) {
      e.name = 'Name must not exceed 200 characters'
    } else if (!SAFE_TEXT.test(form.name.trim())) {
      e.name = 'Name must not contain special characters like $%^&*#@!'
    }

    // SKU
    if (!form.sku.trim()) {
      e.sku = 'SKU is required'
    } else if (form.sku.trim().length < 2) {
      e.sku = 'SKU must be at least 2 characters'
    } else if (form.sku.trim().length > 100) {
      e.sku = 'SKU must not exceed 100 characters'
    } else if (!SAFE_SKU.test(form.sku.trim())) {
      e.sku = 'SKU can only contain letters, numbers, hyphens and underscores'
    }

    // Price
    if (form.price === '' || form.price === null) {
      e.price = 'Selling price is required'
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      e.price = 'Price must be a valid positive number'
    } else if (Number(form.price) > 10000000) {
      e.price = 'Price seems too high — max ₹1,00,00,000'
    }

    // Cost price (optional)
    if (form.cost_price !== '') {
      if (isNaN(Number(form.cost_price)) || Number(form.cost_price) < 0) {
        e.cost_price = 'Cost price must be a valid positive number'
      }
    }

    // Quantity
    if (form.quantity_in_stock === '') {
      e.quantity_in_stock = 'Quantity is required'
    } else if (!Number.isInteger(Number(form.quantity_in_stock)) || Number(form.quantity_in_stock) < 0) {
      e.quantity_in_stock = 'Quantity must be a whole number (0 or more)'
    }

    // Reorder level
    if (form.reorder_level !== '' && (!Number.isInteger(Number(form.reorder_level)) || Number(form.reorder_level) < 0)) {
      e.reorder_level = 'Reorder level must be a whole number (0 or more)'
    }

    // Description (optional but restrict special chars)
    if (form.description && form.description.length > 1000) {
      e.description = 'Description must not exceed 1000 characters'
    }

    // Image URL (optional but must be valid if provided)
    if (form.image_url && !URL_PATTERN.test(form.image_url)) {
      e.image_url = 'Image URL must start with http:// or https://'
    }

    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        quantity_in_stock: parseInt(form.quantity_in_stock),
        reorder_level: parseInt(form.reorder_level) || 10,
        image_url: form.image_url.trim() || null,
      }
      if (isEdit) {
        await productsApi.update(product.id, payload)
        toast.success('Product updated successfully')
      } else {
        await productsApi.create(payload)
        toast.success('Product created successfully')
      }
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add New Product'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. iPhone 15 Pro" className="input-field" maxLength={200} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">SKU / Code *</label>
            <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. IPH-15P-256" className="input-field" maxLength={100} />
            {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
          </div>
          <div>
            <label className="label">Selling Price (₹) *</label>
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" className="input-field" />
            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="label">Cost Price (₹)</label>
            <input name="cost_price" type="number" min="0" step="0.01" value={form.cost_price} onChange={handleChange} placeholder="0.00" className="input-field" />
            {errors.cost_price && <p className="text-red-400 text-xs mt-1">{errors.cost_price}</p>}
          </div>
          <div>
            <label className="label">Quantity in Stock *</label>
            <input name="quantity_in_stock" type="number" min="0" step="1" value={form.quantity_in_stock} onChange={handleChange} placeholder="0" className="input-field" />
            {errors.quantity_in_stock && <p className="text-red-400 text-xs mt-1">{errors.quantity_in_stock}</p>}
          </div>
          <div>
            <label className="label">Reorder Level</label>
            <input name="reorder_level" type="number" min="0" step="1" value={form.reorder_level} onChange={handleChange} placeholder="10" className="input-field" />
            {errors.reorder_level && <p className="text-red-400 text-xs mt-1">{errors.reorder_level}</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="input-field">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Unit</label>
            <select name="unit" value={form.unit} onChange={handleChange} className="input-field">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Brief product description..." className="input-field resize-none" maxLength={1000} />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          <p className="text-xs text-slate-600 mt-1 text-right">{form.description.length}/1000</p>
        </div>
        <div>
          <label className="label">Image URL</label>
          <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" className="input-field" />
          {errors.image_url && <p className="text-red-400 text-xs mt-1">{errors.image_url}</p>}
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
