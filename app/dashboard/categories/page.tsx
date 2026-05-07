'use client'

import { Suspense } from 'react'
import { Grid, List, Settings2 } from 'lucide-react'
import { CategoryTable } from '@/components/categories/category-table'
import { CategoryTreeDraggable } from '@/components/categories/category-tree-draggable'
import { CategoryFormModal } from '@/components/categories/category-form-modal'
import { useQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import api from '@/lib/api-client'
import type { Category } from '@/types'

function CategoriesPageInner() {
  const [state, setState] = useTableState({
    view: 'tree' as 'tree' | 'table',
    maxDepth: 3,
    showModal: false,
    editId: 0,
    showDepthConfig: false,
  })

  const { view: viewMode, maxDepth, showModal, editId, showDepthConfig } = state

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () =>
      api.get<{ data: Category[] }>('/api/categories').then((r) => {
        const result = r.data.data
        return Array.isArray(result) ? result : []
      }),
    staleTime: Infinity, // Categories rất ít thay đổi
    gcTime: Infinity,
  })

  const categories = data ?? []

  const openCreate = () => setState({ editId: 0, showModal: true })
  const openEdit = (id: number) => setState({ editId: id, showModal: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Cấu hình số cấp tối đa */}
          <div className="relative">
            <button
              onClick={() => setState({ showDepthConfig: !showDepthConfig })}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showDepthConfig ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:text-gray-800'
              }`}
              title="Cấu hình số cấp tối đa"
            >
              <Settings2 size={13} />
              Tối đa {maxDepth} cấp
            </button>
            {showDepthConfig && (
              <div className="absolute right-0 top-full mt-1.5 z-20 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-gray-600">Số cấp danh mục tối đa</p>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setState({ maxDepth: n, showDepthConfig: false })}
                      className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
                        maxDepth === n
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  Giới hạn độ sâu khi thêm danh mục con
                </p>
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setState({ view: 'tree' })}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'tree' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid size={12} /> Cây
            </button>
            <button
              onClick={() => setState({ view: 'table' })}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List size={12} /> Bảng
            </button>
          </div>

          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Thêm danh mục
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <CategoryTreeDraggable
          categories={categories}
          isLoading={isLoading}
          isError={isError}
          onEdit={openEdit}
          maxDepth={maxDepth}
        />
      ) : (
        <CategoryTable onEdit={openEdit} maxDepth={maxDepth} />
      )}

      {showModal && (
        <CategoryFormModal
          categoryId={editId > 0 ? editId : undefined}
          onClose={() => setState({ showModal: false })}
          maxDepth={maxDepth}
        />
      )}
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Đang tải...</div>}>
      <CategoriesPageInner />
    </Suspense>
  )
}
