'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'
import type { Brand, PaginatedResponse } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function BrandTableInner() {
  const queryClient = useQueryClient()

  // Persist search/page vào URL — quay lại trang vẫn giữ filter
  const [state, setState] = useTableState({ page: 1, search: '' })
  const { page, search } = state

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-brands', page, search],
    queryFn: () =>
      api.get<PaginatedResponse<Brand>>('/api/brands', {
        page,
        per_page: 15,
        search: search || undefined,
      }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-brands'] }),
  })

  const brands = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa thương hiệu "${name}"?`)) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setState({ search: e.target.value })}
          placeholder="Tìm thương hiệu..."
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>
        ) : isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">Không thể tải dữ liệu</div>
        ) : brands.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Không có thương hiệu nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Tên thương hiệu</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {brand.logo ? (
                      <img src={`${API}${brand.logo}`} alt={brand.name} className="h-8 w-8 rounded object-contain border border-gray-100" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-400 uppercase">
                        {brand.name[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{brand.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{brand.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/brands/${brand.id}/edit`} className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50">Sửa</Link>
                      <button
                        onClick={() => handleDelete(brand.id, brand.name)}
                        disabled={deleteMutation.isPending}
                        className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Trang {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button onClick={() => setState({ page: Math.max(1, page - 1) })} disabled={page === 1} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40">Trước</button>
            <button onClick={() => setState({ page: Math.min(lastPage, page + 1) })} disabled={page === lastPage} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40">Sau</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BrandTable() {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>}>
      <BrandTableInner />
    </Suspense>
  )
}

