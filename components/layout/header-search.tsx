'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors md:hidden"
        title="Tìm kiếm"
      >
        <Search size={18} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 md:hidden">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm kiếm..."
          className="h-9 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button onClick={() => { setOpen(false); setQuery('') }} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  )
}

export function HeaderSearchDesktop() {
  const [query, setQuery] = useState('')
  return (
    <div className="relative hidden md:block">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Tìm kiếm sản phẩm, đơn hàng..."
        className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
      />
    </div>
  )
}
