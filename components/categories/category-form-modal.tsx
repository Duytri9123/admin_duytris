'use client'

import { useState, useEffect } from 'react'
import { X, Folder, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Category, ApiResponse } from '@/types'
import type { CategoryNode } from './category-tree-draggable'

const MAX_DEPTH = 3

interface Props {
  categoryId?: number
  onClose: () => void
  maxDepth?: number
}

interface FormFields {
  name: string
  slug: string
  parent_id: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Flatten nested tree thành list phẳng kèm depth với ký tự cây ├─ └─
function flattenForSelect(
  nodes: CategoryNode[],
  maxDepth: number,
  depth = 0,
  isLast: boolean[] = []
): { id: number; label: string; disabled: boolean }[] {
  return nodes.flatMap((n, idx) => {
    const last = idx === nodes.length - 1
    const prefix = depth === 0
      ? ''
      : isLast.slice(1).map((l) => (l ? '\u00a0\u00a0\u00a0\u00a0' : '\u2502\u00a0\u00a0\u00a0')).join('') +
        (last ? '\u2514\u2500 ' : '\u251C\u2500 ')
    return [
      { id: n.id, label: prefix + n.name, disabled: depth >= maxDepth - 1 },
      ...flattenForSelect(n.children ?? [], maxDepth, depth + 1, [...isLast, last]),
    ]
  })
}

export function CategoryFormModal({ categoryId, onClose, maxDepth = 3 }: Props) {
  const queryClient = useQueryClient()
  const isEdit = categoryId !== undefined

  const [form, setForm] = useState<FormFields>({ name: '', slug: '', parent_id: '' })
  const [errors, setErrors] = useState<Partial<FormFields>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  // Dùng lại cache từ admin-categories (nested tree)
  const { data: treeData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get<{ data: CategoryNode[] }>('/api/categories').then((r) => r.data.data),
  })

  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => api.get<ApiResponse<Category>>(`/api/categories/${categoryId}`).then((r) => r.data.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (categoryData) {
      setForm({
        name: categoryData.name,
        slug: categoryData.slug,
        parent_id: categoryData.parent?.id?.toString() ?? '',
      })
    }
  }, [categoryData])

  const mutation = useMutation({
    mutationFn: (payload: object) =>
      isEdit
        ? api.put<ApiResponse<Category>>(`/api/categories/${categoryId}`, payload)
        : api.post<ApiResponse<Category>>('/api/categories', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      onClose()
    },
    onError: (err: unknown) => {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi.')
    },
  })

  const validate = () => {
    const errs: Partial<FormFields> = {}
    if (!form.name.trim()) errs.name = 'Tên danh mục là bắt buộc'
    if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    mutation.mutate({
      name: form.name,
      slug: form.slug,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
    })
  }

  const inp = (key: keyof FormFields) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`

  // Flatten tree, loại bỏ chính nó (khi edit)
  const selectOptions = flattenForSelect(
    (treeData ?? []).filter((n) => n.id !== categoryId),
    maxDepth
  )

  const selectedParentDisabled = form.parent_id !== '' &&
    selectOptions.find((o) => o.id === Number(form.parent_id))?.disabled

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Folder size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              {serverError}
            </div>
          )}

          {/* Tên */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên danh mục *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({
                ...p,
                name: e.target.value,
                slug: p.slug === slugify(p.name) || !p.slug ? slugify(e.target.value) : p.slug,
              }))}
              className={inp('name')}
              placeholder="Nhập tên danh mục"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className={inp('slug')}
              placeholder="ten-danh-muc"
            />
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
          </div>

          {/* Danh mục cha */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Danh mục cha
              <span className="ml-1.5 text-xs font-normal text-gray-400">(tối đa {maxDepth} cấp)</span>
            </label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
              className={inp('parent_id')}
            >
              <option value="">— Không có (danh mục gốc) —</option>
              {selectOptions.map((o) => (
                <option key={o.id} value={o.id} disabled={o.disabled}>
                  {o.label}{o.disabled ? ' ✕ đã đủ cấp' : ''}
                </option>
              ))}
            </select>
            {selectedParentDisabled && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle size={11} />
                Danh mục này đã ở cấp {maxDepth - 1}, không thể thêm con
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !!selectedParentDisabled}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
