'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, X, Package, ShoppingCart, Users, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { PaginatedResponse, Product, Order } from '@/types'

// ─── Search results dropdown ──────────────────────────────────────────────────
function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const router = useRouter()

  const { data: products, isLoading: loadingP } = useQuery({
    queryKey: ['header-search-products', query],
    queryFn: () => api.get<PaginatedResponse<Product>>('/api/products', { search: query, per_page: 4 }).then((r) => r.data),
    enabled: query.length >= 2,
  })

  const { data: orders, isLoading: loadingO } = useQuery({
    queryKey: ['header-search-orders', query],
    queryFn: () => api.get<PaginatedResponse<Order>>('/api/admin/orders', { search: query, per_page: 3 }).then((r) => r.data),
    enabled: query.length >= 2,
  })

  const isLoading = loadingP || loadingO
  const hasProducts = (products?.data?.length ?? 0) > 0
  const hasOrders = (orders?.data?.length ?? 0) > 0
  const hasResults = hasProducts || hasOrders

  if (query.length < 2) return null

  const go = (href: string) => { router.push(href); onClose() }

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Đang tìm...
        </div>
      ) : !hasResults ? (
        <div className="py-6 text-center text-sm text-gray-400">
          Không tìm thấy kết quả cho "<strong>{query}</strong>"
        </div>
      ) : (
        <div>
          {hasProducts && (
            <div>
              <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                <Package size={10} /> Sản phẩm
              </div>
              {products!.data!.map((p) => {
                const thumb = p.images?.find((i) => i.is_thumbnail)?.url ?? p.images?.[0]?.url
                return (
                  <button
                    key={p.id}
                    onClick={() => go(`/dashboard/products/${p.id}`)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    {thumb ? (
                      <img src={thumb} alt={p.name} className="h-8 w-8 rounded-lg object-cover border border-gray-200 shrink-0" />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <Package size={14} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category?.name ?? '—'}</p>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => go(`/dashboard/products?search=${encodeURIComponent(query)}`)}
                className="flex w-full items-center justify-center py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border-t border-gray-100"
              >
                Xem tất cả sản phẩm →
              </button>
            </div>
          )}

          {hasOrders && (
            <div>
              <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                <ShoppingCart size={10} /> Đơn hàng
              </div>
              {orders!.data!.map((o) => (
                <button
                  key={o.id}
                  onClick={() => go(`/dashboard/orders/${o.id}`)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <ShoppingCart size={14} className="text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">Đơn #{o.id}</p>
                    <p className="text-xs text-gray-400">{o.total_amount?.toLocaleString('vi-VN')}₫ · {o.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Desktop search ───────────────────────────────────────────────────────────
export function HeaderSearchDesktop() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Tìm kiếm sản phẩm, đơn hàng..."
        className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setFocused(false) }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={13} />
        </button>
      )}
      {focused && query.length >= 2 && (
        <SearchResults query={query} onClose={() => { setQuery(''); setFocused(false) }} />
      )}
    </div>
  )
}

// ─── Mobile search ────────────────────────────────────────────────────────────
export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    <div ref={wrapRef} className="relative flex items-center gap-2 md:hidden">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm..."
          className="h-9 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button onClick={() => { setOpen(false); setQuery('') }} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
      {query.length >= 2 && (
        <SearchResults query={query} onClose={() => { setOpen(false); setQuery('') }} />
      )}
    </div>
  )
}
