'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Eye, Pencil, Trash2, Package, Star, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/lib/api-client'
import type { PaginatedResponse, Product } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Resolve image URL từ backend — field `url` là raw path như `product_media/...` */
function resolveAdminImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/storage/')) return `${API_URL}${url}`
  if (url.startsWith('/')) return `${API_URL}${url}`
  // raw path: product_media/... hoặc storage/product_media/...
  const path = url.startsWith('storage/') ? url : `storage/${url}`
  return `${API_URL}/${path}`
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Hoạt động' },
    inactive: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Tạm dừng'  },
    draft:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Nháp'       },
  }
  const s = map[status] ?? map.draft
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

interface ProductGridProps {
  page: number
  search: string
  categoryId?: number | null
  onPageChange: (page: number) => void
}

export function ProductGrid({ page, search, categoryId, onPageChange }: ProductGridProps) {
  const queryClient = useQueryClient()
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products', page, search, categoryId],
    queryFn: () =>
      api.get<PaginatedResponse<Product>>('/api/products', {
        page,
        per_page: 12,
        search: search || undefined,
        category_id: categoryId || undefined,
      }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setConfirmDeleteId(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/api/products/${id}`, { status: status === 'active' ? 'inactive' : 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const products = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12 text-center">
        <p className="text-sm font-medium text-red-600">Không thể tải dữ liệu</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-products'] })} className="mt-2 text-xs text-red-500 hover:underline">
          Thử lại
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
        <Package size={40} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">
          {search ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
        </p>
        {!search && (
          <Link href="/dashboard/products/new" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            + Tạo sản phẩm đầu tiên
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => {
          const defaultVariant = product.variants?.find((v) => v.is_default) ?? product.variants?.[0]
          const thumbnail = product.images?.find((img) => img.is_thumbnail)?.url ?? product.images?.[0]?.url
          const variantCount = product.variants?.length ?? 0
          const hasDiscount = defaultVariant && defaultVariant.original_price > defaultVariant.selling_price
          const discountPct = hasDiscount
            ? Math.round((1 - defaultVariant.selling_price / defaultVariant.original_price) * 100)
            : 0

          return (
            <div
              key={product.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden bg-gray-100 shrink-0">
                {thumbnail ? (
                  <img
                    src={resolveAdminImageUrl(thumbnail)}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package size={36} className="text-gray-300" />
                  </div>
                )}

                {/* Status badge top-left */}
                <div className="absolute left-2 top-2">{statusBadge(product.status)}</div>

                {/* Discount badge top-right */}
                {discountPct > 0 && (
                  <span className="absolute right-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    -{discountPct}%
                  </span>
                )}

                {/* Hover overlay actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow hover:bg-gray-50"
                    title="Xem chi tiết"
                  >
                    <Eye size={14} />
                  </Link>
                  <Link
                    href={`/dashboard/products/${product.id}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow hover:bg-indigo-50"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => setConfirmDeleteId(product.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600 shadow hover:bg-red-50"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-2.5">
                <h3 className="line-clamp-2 text-xs font-semibold text-gray-900 leading-snug">{product.name}</h3>

                {/* Short description */}
                {product.short_description && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-400 leading-snug">{product.short_description}</p>
                )}

                {/* Brand + Category */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.brand?.name && (
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-medium text-gray-500">{product.brand.name}</span>
                  )}
                  {product.category?.name && (
                    <span className="rounded bg-indigo-50 px-1 py-0.5 text-[10px] font-medium text-indigo-500">{product.category.name}</span>
                  )}
                </div>

                {/* Rating */}
                {product.avg_rating > 0 && (
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={9} className={s <= Math.round(product.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                    <span className="ml-0.5 text-[9px] text-gray-400">({product.rating_count})</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-auto pt-2">
                  {defaultVariant ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-indigo-600">
                        {defaultVariant.selling_price.toLocaleString('vi-VN')}₫
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {defaultVariant.original_price.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">Chưa có giá</span>
                  )}
                  {variantCount > 1 && (
                    <p className="text-[9px] text-gray-400">{variantCount} biến thể</p>
                  )}
                </div>

                {/* Toggle active/inactive */}
                <button
                  onClick={() => toggleMutation.mutate({ id: product.id, status: product.status })}
                  disabled={toggleMutation.isPending || product.status === 'draft'}
                  className={`mt-2 flex w-full items-center justify-center gap-1 rounded-lg border py-1 text-[10px] font-semibold transition-colors disabled:opacity-40 ${
                    product.status === 'active'
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {product.status === 'active'
                    ? <><ToggleRight size={11} /> Đang bật</>
                    : <><ToggleLeft size={11} /> Đang tắt</>
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span className="text-xs">Trang {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <button
              onClick={() => onPageChange(Math.min(lastPage, page + 1))}
              disabled={page === lastPage}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">Xác nhận xóa</h3>
            <p className="mt-2 text-sm text-gray-600">Bạn có chắc muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
