import clsx from 'clsx'

export default function StockBadge({ qty, reorderLevel }) {
  const isOut = qty === 0
  const isLow = !isOut && qty <= reorderLevel

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      isOut
        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
        : isLow
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        : 'bg-green-500/20 text-green-400 border border-green-500/30',
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        isOut ? 'bg-red-400' : isLow ? 'bg-yellow-400' : 'bg-green-400',
      )} />
      {isOut ? 'Out of stock' : isLow ? `Low (${qty})` : qty}
    </span>
  )
}
