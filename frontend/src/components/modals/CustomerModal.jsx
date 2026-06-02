import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { customersApi } from '../../services/api'
import toast from 'react-hot-toast'

// Only letters, spaces, hyphens, apostrophes (for names like O'Brien, Mary-Jane)
const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/
// Letters, numbers, spaces, basic punctuation — no $%^&*#!
const SAFE_TEXT = /^[a-zA-Z0-9 \-'.,&/()+]+$/
// Strict email: local@domain.tld — no consecutive dots, valid TLD min 2 chars
const EMAIL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
// Phone: optional +, then digits/spaces/dashes/parens, 7-15 digits total
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/
const DIGITS_ONLY = /\d/g

const empty = {
  full_name: '', email: '', phone: '', company: '',
  address: '', city: '', country: '', customer_type: 'retail',
}

export default function CustomerModal({ isOpen, onClose, onSaved, customer }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = Boolean(customer)

  useEffect(() => {
    if (customer) {
      setForm({
        full_name: customer.full_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        customer_type: customer.customer_type || 'retail',
      })
    } else {
      setForm(empty)
    }
    setErrors({})
  }, [customer, isOpen])

  const validate = () => {
    const e = {}

    // Full name
    if (!form.full_name.trim()) {
      e.full_name = 'Full name is required'
    } else if (form.full_name.trim().length < 2) {
      e.full_name = 'Name must be at least 2 characters'
    } else if (form.full_name.trim().length > 150) {
      e.full_name = 'Name must not exceed 150 characters'
    } else if (!NAME_REGEX.test(form.full_name.trim())) {
      e.full_name = 'Name can only contain letters, spaces, hyphens and apostrophes'
    }

    // Email — strict validation
    if (!form.email.trim()) {
      e.email = 'Email address is required'
    } else if (form.email.length > 254) {
      e.email = 'Email address is too long'
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      e.email = 'Enter a valid email address (e.g. name@example.com)'
    } else {
      // Extra check: domain must have a valid TLD (not just numbers)
      const domain = form.email.split('@')[1] || ''
      const tld = domain.split('.').pop()
      if (/^\d+$/.test(tld)) {
        e.email = 'Email domain extension cannot be all numbers'
      }
    }

    // Phone (optional)
    if (form.phone.trim()) {
      const digits = (form.phone.match(DIGITS_ONLY) || []).length
      if (!PHONE_REGEX.test(form.phone.trim())) {
        e.phone = 'Invalid phone number format'
      } else if (digits < 7) {
        e.phone = 'Phone number must have at least 7 digits'
      } else if (digits > 15) {
        e.phone = 'Phone number must not exceed 15 digits'
      }
    }

    // Company (optional)
    if (form.company.trim() && !SAFE_TEXT.test(form.company.trim())) {
      e.company = 'Company name must not contain special characters like $%^&*#@!'
    }

    // City (optional)
    if (form.city.trim() && !NAME_REGEX.test(form.city.trim())) {
      e.city = 'City name can only contain letters, spaces and hyphens'
    }

    // Country (optional)
    if (form.country.trim() && !NAME_REGEX.test(form.country.trim())) {
      e.country = 'Country name can only contain letters, spaces and hyphens'
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
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        address: form.address.trim() || null,
      }
      if (isEdit) {
        await customersApi.update(customer.id, payload)
        toast.success('Customer updated successfully')
      } else {
        await customersApi.create(payload)
        toast.success('Customer added successfully')
      }
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Customer' : 'Add New Customer'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Rahul Sharma" className="input-field" maxLength={150} />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <label className="label">Email Address *</label>
            <input name="email" type="text" value={form.email} onChange={handleChange} placeholder="rahul@example.com" className="input-field" maxLength={254} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="input-field" maxLength={20} />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Company</label>
            <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" className="input-field" maxLength={200} />
            {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" className="input-field" maxLength={100} />
            {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="label">Country</label>
            <input name="country" value={form.country} onChange={handleChange} placeholder="India" className="input-field" maxLength={100} />
            {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Customer Type</label>
            <div className="flex gap-3">
              {['retail', 'wholesale', 'vip'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="customer_type"
                    value={type}
                    checked={form.customer_type === type}
                    onChange={handleChange}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <span className="text-sm text-slate-300 capitalize group-hover:text-white transition-colors">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Street address..." className="input-field resize-none" maxLength={500} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
