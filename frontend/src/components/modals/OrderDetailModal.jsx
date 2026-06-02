import Modal from '../ui/Modal'
import { formatCurrency, formatDateTime, statusColors } from '../../utils/helpers'
import clsx from 'clsx'

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

export default function OrderDetailModal({ isOpen, onClose, order, onStatusChange }) {
  if (!order) return null

  const steps = ORDER_STATUSES.filter((s) => s !== 'cancelled')
  const currentIdx = steps.indexOf(order.status)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order #${order.order_number}`} size="xl">
      <div className="space-y-6">
        {/* Status tracker */}
        {order.status !== 'cancelled' && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Order Progress</p>
            <div className="flex items-center">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      i < currentIdx ? 'bg-green-500 text-white' :
                      i === currentIdx ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' :
                      'bg-slate-700 text-slate-500',
                    )}>
                      {i < currentIdx ? '✓' : i + 1}
                    </div>
                    <span className={clsx('text-xs capitalize hidden sm:block', i <= currentIdx ? 'text-white' : 'text-slate-500')}>{step}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={clsx('flex-1 h-0.5 mx-2', i < currentIdx ? 'bg-green-500' : 'bg-slate-700')} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Customer</p>
            <p className="text-sm text-white font-medium">{order.customer?.full_name || 'Walk-in'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Status</p>
            <span className={clsx('status-badge', statusColors[order.status])}>{order.status}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Payment</p>
            <span className={clsx('status-badge', statusColors[order.payment_status])}>{order.payment_status}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Payment Method</p>
            <p className="text-sm text-white">{order.payment_method || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Created At</p>
            <p className="text-sm text-white">{formatDateTime(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Total Amount</p>
            <p className="text-sm text-brand-400 font-semibold">{formatCurrency(order.total_amount)}</p>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Items</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="table-header">Product</th>
                  <th className="table-header">SKU</th>
                  <th className="table-header text-right">Unit Price</th>
                  <th className="table-header text-right">Qty</th>
                  <th className="table-header text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell font-medium text-white">{item.product_name}</td>
                    <td className="table-cell text-slate-400 font-mono text-xs">{item.product_sku}</td>
                    <td className="table-cell text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="table-cell text-right">{item.quantity}</td>
                    <td className="table-cell text-right font-medium text-white">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-1.5 border-t border-slate-700/50 pt-3">
            <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-sm text-slate-400"><span>Discount</span><span className="text-red-400">- {formatCurrency(order.discount)}</span></div>}
            {order.tax > 0 && <div className="flex justify-between text-sm text-slate-400"><span>Tax ({order.tax}%)</span><span>{formatCurrency(order.subtotal * order.tax / 100)}</span></div>}
            <div className="flex justify-between text-sm font-semibold text-white pt-1"><span>Total</span><span className="text-brand-400">{formatCurrency(order.total_amount)}</span></div>
          </div>
        </div>

        {order.shipping_address && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Shipping Address</p>
            <p className="text-sm text-slate-300">{order.shipping_address}</p>
          </div>
        )}
        {order.notes && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-slate-300">{order.notes}</p>
          </div>
        )}

        {/* Status update actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
          {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(order.id, s)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize', statusColors[s])}
            >
              Mark as {s}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
