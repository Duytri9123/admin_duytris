'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Eye, Pencil, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react'
import api from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'
import type { PaginatedResponse, Product } from '@/types'

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Hoạt động' },
  inactive: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Tạm dừng'  },
  draft:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Nháp'       },
}

interface ProductTableProps {
  search?: string
  categoryId?: number | null
}

function ProductTableInner({ search = '', categoryId }: ProductTableProps) {
  const queryClient = useQueryClient()
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Persist page vào URL — quay lại trang vẫn ở đúng trang đang xem
  const [state, setState] = useTableState({ page: 1 })
  const { page } = state

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products', page, search, categoryId],
    queryFn: () =>
      api.get<PaginatedResponse<Product>>('/api/products', {
        page,
        per_page: 15,
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

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">Không thể tải dữ liệu</div>
        ) : products.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Không có sản phẩm nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Thương hiệu</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Đánh giá</th>
                <th className="px-4 py-3">Giá bán</th>
                <th className="px-4 py-3">Giá gốc</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const defaultVariant = product.variants?.find((v) => v.is_default) ?? product.variants?.[0]
                const hasDiscount = defaultVariant && defaultVariant.original_price > defaultVariant.selling_price
                const s = STATUS_MAP[product.status] ?? STATUS_MAP.draft
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    {/* Product name + short desc */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 leading-snug">{product.name}</p>
                      {product.short_description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{product.short_description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.brand?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category?.name ?? '—'}</td>
                    {/* Rating */}
                    <td className="px-4 py-3">
                      {product.avg_rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star size={11} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-700">{product.avg_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({product.rating_count})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    {/* Sale price */}
                    <td className="px-4 py-3">
                      {defaultVariant ? (
                        <span className="font-semibold text-indigo-600">
                          {defaultVariant.selling_price.toLocaleString('vi-VN')}₫
                        </span>
                      ) : '—'}
                    </td>
                    {/* Original price */}
                    <td className="px-4 py-3">
                      {hasDiscount ? (
                        <span className="text-xs text-gray-400 line-through">
                          {defaultVariant.original_price.toLocaleString('vi-VN')}₫
                        </span>
                      ) : '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle */}
                        <button
                          onClick={() => toggleMutation.mutate({ id: product.id, status: product.status })}
                          disabled={toggleMutation.isPending || product.status === 'draft'}
                          className={`rounded p-1.5 transition-colors disabled:opacity-40 ${
                            product.status === 'active'
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={product.status === 'active' ? 'Tắt sản phẩm' : 'Bật sản phẩm'}
                        >
                          {product.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => setConfirmDeleteId(product.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="text-xs">Trang {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button onClick={() => setState({ page: Math.max(1, page - 1) })} disabled={page === 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">← Trước</button>
            <button onClick={() => setState({ page: Math.min(lastPage, page + 1) })} disabled={page === lastPage} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Sau →</button>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">Xác nhận xóa</h3>
            <p className="mt-2 text-sm text-gray-600">Bạn có chắc muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={() => deleteMutation.mutate(confirmDeleteId)} disabled={deleteMutation.isPending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProductTable(props: ProductTableProps) {
  return (
    <Suspense fallback={<div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}</div>}>
      <ProductTableInner {...props} />
    </Suspense>
  )
}
