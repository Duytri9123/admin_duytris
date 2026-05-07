'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Category, ApiResponse } from '@/types'

interface CategoryFormProps {
  categoryId?: number
}

interface FormFields {
  name: string
  slug: string
  parent_id: string
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

const defaultForm: FormFields = { name: '', slug: '', parent_id: '' }

export function CategoryForm({ categoryId }: CategoryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = categoryId !== undefined

  const [form, setForm] = useState<FormFields>(defaultForm)
  const [errors, setErrors] = useState<Partial<FormFields>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const { data: allCategories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories', { per_page: 200 }).then((r) => r.data.data),
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
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      router.push('/dashboard/categories')
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

  // Exclude self from parent options
  const parentOptions = (allCategories ?? []).filter((c) => c.id !== categoryId)

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
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
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className={inp('slug')}
          />
          {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Danh mục cha</label>
          <select
            value={form.parent_id}
            onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
            className={inp('parent_id')}
          >
            <option value="">— Không có (danh mục gốc) —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.push('/dashboard/categories')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Hủy
        </button>
        <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo danh mục'}
        </button>
      </div>
    </form>
  )
}
