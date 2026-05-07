'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink, Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff,
  ShoppingBag, TrendingUp, MousePointer, DollarSign, X, Link as LinkIcon,
  Search, Filter, Loader2
} from 'lucide-react'
import api from '@/lib/api-client'

interface AffiliateProduct {
  id: number
  name: string
  description?: string
  image_url?: string
  price?: number
  original_price?: number
  affiliate_url: string
  platform: string
  category?: string
  brand?: string
  commission_rate?: number
  is_active: boolean
  is_featured: boolean
  click_count: number
  order_count: number
  total_commission: number
  created_at: string
}

const PLATFORMS = [
  { value: 'shopee',  label: 'Shopee',  color: 'bg-orange-100 text-orange-700', emoji: '🛒' },
  { value: 'lazada',  label: 'Lazada',  color: 'bg-blue-100 text-blue-700',     emoji: '📦' },
  { value: 'tiki',    label: 'Tiki',    color: 'bg-sky-100 text-sky-700',       emoji: '🔵' },
  { value: 'tiktok',  label: 'TikTok',  color: 'bg-pink-100 text-pink-700',     emoji: '🎵' },
  { value: 'amazon',  label: 'Amazon',  color: 'bg-yellow-100 text-yellow-700', emoji: '📫' },
  { value: 'sendo',   label: 'Sendo',   color: 'bg-red-100 text-red-700',       emoji: '🏪' },
  { value: 'custom',  label: 'Khác',    color: 'bg-gray-100 text-gray-700',     emoji: '🔗' },
]

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORMS.find(x => x.value === platform) ?? PLATFORMS[PLATFORMS.length - 1]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.color}`}>
      {p.emoji} {p.label}
    </span>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function AffiliateModal({ item, onClose }: { item?: AffiliateProduct; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    image_url: item?.image_url ?? '',
    price: item?.price?.toString() ?? '',
    original_price: item?.original_price?.toString() ?? '',
    affiliate_url: item?.affiliate_url ?? '',
    platform: item?.platform ?? 'shopee',
    category: item?.category ?? '',
    brand: item?.brand ?? '',
    commission_rate: item?.commission_rate?.toString() ?? '',
    is_active: item?.is_active ?? true,
    is_featured: item?.is_featured ?? false,
  })
  const [urlInput, setUrlInput] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => item
      ? api.put(`/api/admin/affiliate/${item.id}`, { ...form, price: form.price ? Number(form.price) : null, original_price: form.original_price ? Number(form.original_price) : null, commission_rate: form.commission_rate ? Number(form.commission_rate) : null })
      : api.post('/api/admin/affiliate', { ...form, price: form.price ? Number(form.price) : null, original_price: form.original_price ? Number(form.original_price) : null, commission_rate: form.commission_rate ? Number(form.commission_rate) : null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['affiliate'] }); onClose() },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Lỗi lưu dữ liệu'),
  })

  const scrapeUrl = async (url?: string) => {
    const target = (url ?? urlInput).trim()
    if (!target) return
    setScraping(true)
    setScrapeMsg(null)
    try {
      const { data } = await api.post('/api/admin/affiliate/scrape', { url: target })
      setForm(p => ({
        ...p,
        affiliate_url:  data.affiliate_url  || p.affiliate_url,
        platform:       data.platform       || p.platform,
        name:           data.name           || p.name,
        description:    data.description    || p.description,
        image_url:      data.image_url      || p.image_url,
        price:          data.price?.toString()          || p.price,
        original_price: data.original_price?.toString() || p.original_price,
        brand:          data.brand          || p.brand,
        category:       data.category       || p.category,
      }))
      setScrapeMsg(data.error ?? (data.name ? `✅ Đã tìm thấy: "${data.name}"` : '⚠️ Không tìm được thông tin, vui lòng điền thủ công.'))
    } catch {
      setScrapeMsg('❌ Không thể tải trang. Vui lòng điền thủ công.')
    } finally { setScraping(false) }
  }

  // Auto-scrape khi paste link vào ô URL
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (pasted.startsWith('http')) {
      setUrlInput(pasted)
      setTimeout(() => scrapeUrl(pasted), 50)
    }
  }

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <LinkIcon size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">{item ? 'Chỉnh sửa' : 'Thêm'} sản phẩm affiliate</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          {/* Quick URL import */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="mb-2 text-xs font-semibold text-indigo-700">🔗 Dán link sản phẩm — tự động điền thông tin</p>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onPaste={handleUrlPaste}
                className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Dán link Shopee, Lazada, Tiki... vào đây"
              />
              <button onClick={() => scrapeUrl()} disabled={scraping || !urlInput.trim()} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {scraping ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                {scraping ? 'Đang tìm...' : 'Tìm'}
              </button>
            </div>
            {scraping && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600">
                <Loader2 size={11} className="animate-spin" /> Đang tải thông tin sản phẩm...
              </p>
            )}
            {scrapeMsg && !scraping && (
              <p className="mt-2 text-xs text-indigo-700">{scrapeMsg}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Tên sản phẩm *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inp} placeholder="Tên sản phẩm" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Link affiliate *</label>
              <input value={form.affiliate_url} onChange={e => setForm(p => ({ ...p, affiliate_url: e.target.value }))} className={inp} placeholder="https://..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Sàn TMĐT *</label>
              <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className={inp}>
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.emoji} {p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Hoa hồng (%)</label>
              <input type="number" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))} className={inp} placeholder="5.5" min="0" max="100" step="0.1" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Giá bán (₫)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inp} placeholder="150000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Giá gốc (₫)</label>
              <input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} className={inp} placeholder="200000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Thương hiệu</label>
              <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} className={inp} placeholder="Nike, Adidas..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Danh mục</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp} placeholder="Giày dép, Thời trang..." />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">URL ảnh</label>
              <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} className={inp} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inp} />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
              <span className="text-sm text-gray-700">Hiển thị</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
              <span className="text-sm text-gray-700">Nổi bật</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || !form.affiliate_url || mutation.isPending}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {mutation.isPending ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AffiliatePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [modal, setModal] = useState<{ open: boolean; item?: AffiliateProduct }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate', page, search, platformFilter],
    queryFn: () => api.get<any>('/api/admin/affiliate', { page, per_page: 12, search: search || undefined, platform: platformFilter || undefined }).then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: () => api.get<any>('/api/admin/affiliate/stats').then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.put(`/api/admin/affiliate/${id}`, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliate'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/affiliate/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliate'] }),
  })

  const items: AffiliateProduct[] = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Sản phẩm Affiliate</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý sản phẩm từ Shopee, Lazada, Tiki và các sàn khác</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: ShoppingBag, label: 'Tổng SP', value: stats.total, color: 'bg-indigo-100 text-indigo-600' },
            { icon: MousePointer, label: 'Lượt click', value: stats.total_clicks?.toLocaleString(), color: 'bg-blue-100 text-blue-600' },
            { icon: TrendingUp, label: 'Đơn hàng', value: stats.total_orders, color: 'bg-green-100 text-green-600' },
            { icon: DollarSign, label: 'Hoa hồng', value: `${Number(stats.total_commission).toLocaleString('vi-VN')}₫`, color: 'bg-yellow-100 text-yellow-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon size={16} /></div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1) }} className="flex flex-1 gap-2">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Tìm sản phẩm affiliate..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Tìm</button>
        </form>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => { setPlatformFilter(''); setPage(1) }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${!platformFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            Tất cả
          </button>
          {PLATFORMS.map(p => (
            <button key={p.value} onClick={() => { setPlatformFilter(p.value); setPage(1) }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${platformFilter === p.value ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <ShoppingBag size={40} className="mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Chưa có sản phẩm affiliate nào</p>
          <button onClick={() => setModal({ open: true })} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            + Thêm sản phẩm đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(item => {
            const hasDiscount = item.price && item.original_price && item.original_price > item.price
            const discountPct = hasDiscount ? Math.round((1 - item.price! / item.original_price!) * 100) : 0
            return (
              <div key={item.id} className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${!item.is_active ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="relative h-36 overflow-hidden bg-gray-100 shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ShoppingBag size={32} className="text-gray-300" /></div>
                  )}
                  <div className="absolute left-2 top-2"><PlatformBadge platform={item.platform} /></div>
                  {discountPct > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{discountPct}%</span>
                  )}
                  {item.is_featured && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[9px] font-bold text-yellow-900">⭐ Nổi bật</span>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <a href={item.affiliate_url} target="_blank" rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow hover:bg-gray-50" title="Mở link">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => setModal({ open: true, item })}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow hover:bg-indigo-50">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Xóa sản phẩm này?')) deleteMutation.mutate(item.id) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600 shadow hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-2.5">
                  <h3 className="line-clamp-2 text-xs font-semibold text-gray-900 leading-snug">{item.name}</h3>
                  {item.brand && <p className="mt-0.5 text-[10px] text-gray-400">{item.brand}</p>}

                  <div className="mt-auto pt-2">
                    {item.price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-indigo-600">{item.price.toLocaleString('vi-VN')}₫</span>
                        {hasDiscount && <span className="text-[10px] text-gray-400 line-through">{item.original_price!.toLocaleString('vi-VN')}₫</span>}
                      </div>
                    ) : null}
                    {item.commission_rate && (
                      <p className="text-[10px] text-green-600 font-medium">💰 {item.commission_rate}% hoa hồng</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-400">
                      <span className="flex items-center gap-0.5"><MousePointer size={8} /> {item.click_count}</span>
                      <span className="flex items-center gap-0.5"><TrendingUp size={8} /> {item.order_count}</span>
                    </div>
                  </div>

                  <button onClick={() => toggleMutation.mutate({ id: item.id, active: !item.is_active })}
                    className={`mt-2 flex w-full items-center justify-center gap-1 rounded-lg border py-1 text-[10px] font-semibold transition-colors ${item.is_active ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {item.is_active ? <><Eye size={10} /> Hiển thị</> : <><EyeOff size={10} /> Ẩn</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Trang {page}/{lastPage}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">← Trước</button>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Sau →</button>
          </div>
        </div>
      )}

      {modal.open && <AffiliateModal item={modal.item} onClose={() => setModal({ open: false })} />}
    </div>
  )
}
