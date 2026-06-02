import clsx from 'clsx'

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-slate-700 border-t-brand-500', sizes[size], className)} />
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  )
}
