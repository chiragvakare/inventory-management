import { Search, Menu, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: "Welcome back — here's your overview" },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/customers': { title: 'Customers', subtitle: 'View and manage customer records' },
  '/orders': { title: 'Orders', subtitle: 'Track and manage all orders' },
  '/inventory': { title: 'Inventory', subtitle: 'Monitor stock levels and adjustments' },
  '/reports': { title: 'Reports', subtitle: 'Analytics and business insights' },
}

export default function Header({ pathname, mobileOpen, setMobileOpen, onSearch }) {
  const [searchVal, setSearchVal] = useState('')
  const navigate = useNavigate()
  const info = pageTitles[pathname] || pageTitles['/']

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  const handleClear = () => {
    setSearchVal('')
    // If already on products page, clear the search
    if (pathname === '/products') {
      navigate('/products')
    }
  }

  const handleChange = (e) => {
    const val = e.target.value
    setSearchVal(val)
    // If user clears the box while on products page, reset to full listing
    if (val === '' && pathname === '/products') {
      navigate('/products')
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">{info.title}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search — navigates to products, clears filter when emptied */}
        <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={searchVal}
            onChange={handleChange}
            placeholder="Search products..."
            className="pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 w-56 transition-all"
          />
          {searchVal && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">Admin</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
