'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Grid, List, Bot, X, ChevronDown, Folder } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ProductTable } from '@/components/products/product-table'
import { ProductGrid } from '@/components/products/product-grid'
import { useTableState } from '@/hooks/use-table-state'
import api from '@/lib/api-client'
import type { Category, PaginatedResponse } from '@/types'

// ─── Build flat category list with indent labels ──────────────────────────────
function flattenCategories(cats: Category[], depth = 0): { id: number; label: string }[] {
  const result: { id: number; label: string }[] = []
  for (const c of cats) {
    result.push({ id: c.id, label: `${'—'.repeat(depth)} ${c.name}`.trim() })
    if ((c as any).children?.length) {
      result.push(...flattenCategories((c as any).children, depth + 1))
    }
  }
  return result
}

// ─── AI creation modal ────────────────────────────────────────────────────────
function AiCreateModal({ onClose, onManual }: { onClose: () => void; onManual: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
          <Bot size={24} className="text-indigo-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Tạo sản phẩm bằng AI?</h3>
        <p className="mt-1.5 text-sm text-gray-500">
          AI có thể giúp bạn tạo tên, mô tả, từ khóa SEO và gợi ý giá cho sản phẩm mới.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => { router.push('/dashboard/ai?action=create_product'); onClose() }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Bot size={16} /> Tạo bằng AI
          </button>
          <button
            onClick={() => { onManual(); onClose() }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Tạo thủ công
          </button>
        </div>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Main page — cần Suspense vì useTableState dùng useSearchParams ───────────
function ProductsPageInner() {
  const router = useRouter()

  // Tất cả filter/page được persist vào URL
  // Khi quay lại trang, URL vẫn còn → queryKey giống → React Query dùng cache
  const [state, setState] = useTableState({
    view: 'grid' as 'grid' | 'list',
    page: 1,
    search: '',
    categoryId: 0,
    showAiModal: false,
    showCategoryFilter: false,
  })

  const { view: viewMode, page, search, categoryId, showAiModal, showCategoryFilter } = state

  // Categories — staleTime Infinity vì ít thay đổi
  const { data: catData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () =>
      api.get<PaginatedResponse<Category>>('/api/categories', { per_page: 200 }).then((r) => r.data),
    staleTime: Infinity, // Categories rất ít thay đổi — cache mãi mãi
    gcTime: Infinity,
  })
  const categories = flattenCategories(catData?.data ?? [])
  const selectedCatLabel = categories.find((c) => c.id === categoryId)?.label

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Sản phẩm</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setState({ view: 'grid' })}
              className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid size={12} /> <span className="hidden sm:inline">Lưới</span>
            </button>
            <button
              onClick={() => setState({ view: 'list' })}
              className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List size={12} /> <span className="hidden sm:inline">Danh sách</span>
            </button>
          </div>
          <button
            onClick={() => setState({ showAiModal: true })}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 sm:px-4 sm:text-sm"
          >
            + <span className="hidden sm:inline">Thêm </span>sản phẩm
          </button>
        </div>
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); setState({ search: (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value }) }}
          className="flex flex-1 gap-2"
        >
          <input
            name="q"
            type="text"
            defaultValue={search}
            key={search} // reset input khi search bị xóa
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Tìm
          </button>
          {(search || categoryId > 0) && (
            <button
              type="button"
              onClick={() => setState({ search: '', categoryId: 0, page: 1 })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Xóa
            </button>
          )}
        </form>

        {/* Category filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setState({ showCategoryFilter: !showCategoryFilter })}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              categoryId > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Folder size={14} />
            {selectedCatLabel ?? 'Danh mục'}
            <ChevronDown size={13} className={`transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`} />
          </button>

          {showCategoryFilter && (
            <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto py-1">
                <button
                  onClick={() => setState({ categoryId: 0, showCategoryFilter: false })}
                  className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${categoryId === 0 ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                >
                  Tất cả danh mục
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setState({ categoryId: c.id, showCategoryFilter: false })}
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${categoryId === c.id ? 'font-semibold text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filters */}
      {(search || categoryId > 0) && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
              Tìm: "{search}"
              <button onClick={() => setState({ search: '' })} className="ml-1 hover:text-indigo-900"><X size={10} /></button>
            </span>
          )}
          {categoryId > 0 && selectedCatLabel && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <Folder size={10} /> {selectedCatLabel}
              <button onClick={() => setState({ categoryId: 0 })} className="ml-1 hover:text-indigo-900"><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        <ProductGrid
          page={page}
          search={search}
          categoryId={categoryId > 0 ? categoryId : null}
          onPageChange={(p) => setState({ page: p })}
        />
      ) : (
        <ProductTable
          search={search}
          categoryId={categoryId > 0 ? categoryId : null}
        />
      )}

      {/* AI creation modal */}
      {showAiModal && (
        <AiCreateModal
          onClose={() => setState({ showAiModal: false })}
          onManual={() => router.push('/dashboard/products/new')}
        />
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Đang tải...</div>}>
      <ProductsPageInner />
    </Suspense>
  )
}
