'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, AlertCircle, X } from 'lucide-react'
import api from '@/lib/api-client'
import { apiClient } from '@/lib/api-client'
import type { CategoryNode } from './category-tree-draggable'

// Flatten nested tree thành list phẳng kèm depth và breadcrumb cha
interface FlatCategory {
  id: number
  name: string
  slug: string
  depth: number
  parentName: string | null
  breadcrumb: string
}

function flattenTree(nodes: CategoryNode[], ancestors: CategoryNode[] = []): FlatCategory[] {
  if (!Array.isArray(nodes)) return []
  return nodes.flatMap((n) => {
    const parentName = ancestors.length > 0 ? ancestors[ancestors.length - 1].name : null
    const breadcrumb = [...ancestors.map((a) => a.name), n.name].join(' › ')
    return [
      { id: n.id, name: n.name, slug: n.slug, depth: ancestors.length, parentName, breadcrumb },
      ...flattenTree(n.children ?? [], [...ancestors, n]),
    ]
  })
}

const DEPTH_LABELS = ['Cấp 1', 'Cấp 2', 'Cấp 3']
const DEPTH_COLORS = [
  'bg-indigo-50 text-indigo-600',
  'bg-blue-50 text-blue-600',
  'bg-teal-50 text-teal-600',
]

interface CategoryTableProps {
  onEdit?: (id: number) => void
  maxDepth?: number
}

export function CategoryTable({ onEdit, maxDepth = 3 }: CategoryTableProps) {
  const [search, setSearch] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: treeData, isLoading, isError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get<{ data: CategoryNode[] }>('/api/categories').then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.get('/sanctum/csrf-cookie')
      return apiClient.delete(`/api/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setDeleteError(null)
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(msg ?? 'Không thể xóa danh mục này')
    },
  })

  const handleDelete = (id: number, name: string) => {
    setDeleteError(null)
    if (!confirm(`Xóa danh mục "${name}"?\n\nLưu ý: không thể xóa nếu còn danh mục con hoặc sản phẩm.`)) return
    deleteMutation.mutate(id)
  }

  const allFlat = flattenTree(treeData ?? [])
  const filtered = search.trim()
    ? allFlat.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : allFlat

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm danh mục..."
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">
            Xóa bộ lọc
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{allFlat.length} danh mục</span>
      </div>

      {/* Error banner */}
      {deleteError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{deleteError}</span>
          <button onClick={() => setDeleteError(null)}><X size={13} /></button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>
        ) : isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">Không thể tải dữ liệu</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            {search ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Tên danh mục</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Cấp</th>
                <th className="px-4 py-3">Danh mục cha</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="font-medium text-gray-900"
                      style={{ paddingLeft: `${cat.depth * 16}px` }}
                    >
                      {cat.depth > 0 && <span className="mr-1 text-gray-300">{'└'}</span>}
                      {cat.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${DEPTH_COLORS[cat.depth] ?? 'bg-gray-100 text-gray-500'}`}>
                      {`Cấp ${cat.depth + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {cat.parentName ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit?.(cat.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        <Pencil size={11} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === cat.id}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 size={11} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
