import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../services/api'
import { formatDate, statusColors, debounce } from '../utils/helpers'
import CustomerModal from '../components/modals/CustomerModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import { Plus, Search, Users, Edit2, Trash2, Mail, Phone, Building2, RefreshCw, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TYPE_ICONS = { vip: Crown, wholesale: Building2, retail: Users }
const typeColors = { retail: 'bg-slate-500/20 text-slate-400 border-slate-500/30', wholesale: 'bg-brand-500/20 text-brand-400 border-brand-500/30', vip: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (selectedType) params.customer_type = selectedType
      const res = await customersApi.getAll(params)
      setCustomers(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, selectedType])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const debouncedSearch = useCallback(debounce((val) => setSearch(val), 400), [])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await customersApi.delete(deleteTarget.id)
      toast.success('Customer deleted')
      setDeleteTarget(null)
      fetchCustomers()
    } finally {
      setDeleteLoading(false)
    }
  }

  const typeCounts = { retail: 0, wholesale: 0, vip: 0 }
  customers.forEach((c) => { if (typeCounts[c.customer_type] !== undefined) typeCounts[c.customer_type]++ })

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-white">{customers.length}</p>
        </div>
        {['retail', 'wholesale', 'vip'].map((type) => {
          const Icon = TYPE_ICONS[type]
          return (
            <div key={type} className="glass-card p-4 flex items-center gap-3">
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border', typeColors[type])}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 capitalize">{type}</p>
                <p className="text-xl font-bold text-white">{typeCounts[type]}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input defaultValue={search} onChange={(e) => debouncedSearch(e.target.value)} placeholder="Search by name, email, company..." className="input-field pl-9" />
          </div>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input-field sm:w-44">
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="vip">VIP</option>
          </select>
          <button onClick={fetchCustomers} className="btn-secondary px-3"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditCustomer(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" />Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Add your first customer to get started." action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Customer</button>} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Company</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const Icon = TYPE_ICONS[c.customer_type] || Users
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{c.full_name}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="w-3 h-3" />{c.email}
                          </div>
                          {c.phone && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="w-3 h-3" />{c.phone}</div>}
                        </div>
                      </td>
                      <td className="table-cell text-slate-400">{c.company || '—'}</td>
                      <td className="table-cell text-slate-400">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="table-cell">
                        <span className={clsx('status-badge border', typeColors[c.customer_type])}>
                          <Icon className="w-3 h-3" />{c.customer_type}
                        </span>
                      </td>
                      <td className="table-cell text-slate-400">{formatDate(c.created_at)}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditCustomer(c); setModalOpen(true) }} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <CustomerModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditCustomer(null) }} onSaved={fetchCustomers} customer={editCustomer} />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Customer"
        message={`Remove "${deleteTarget?.full_name}" from your records?`}
      />
    </div>
  )
}
