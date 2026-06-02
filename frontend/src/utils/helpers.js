export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0)

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const statusColors = {
  // Order statuses
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  packed: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  delivered: 'bg-green-500/20 text-green-400 border border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
  // Payment statuses
  unpaid: 'bg-red-500/20 text-red-400 border border-red-500/30',
  partial: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  paid: 'bg-green-500/20 text-green-400 border border-green-500/30',
  // Customer types
  retail: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  wholesale: 'bg-brand-500/20 text-brand-400 border border-brand-500/30',
  vip: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
}

export const statusDots = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  packed: 'bg-purple-400',
  shipped: 'bg-cyan-400',
  delivered: 'bg-green-400',
  cancelled: 'bg-red-400',
  unpaid: 'bg-red-400',
  partial: 'bg-orange-400',
  paid: 'bg-green-400',
}

export const debounce = (fn, delay) => {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}
