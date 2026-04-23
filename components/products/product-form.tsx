'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { VariantManager } from './variant-manager'
import { SeoPanel } from './seo-panel'
import { AIDescriptionGenerator } from './ai-description-generator'
import type { Brand, Category, Product, ProductVariant, ApiResponse } from '@/types'

interface ProductFormProps {
  productId?: number
}

interface FormData {
  name: string
  slug: string
  description: string
  short_description: string
  status: 'active' | 'inactive' | 'draft'
  brand_id: string
  category_id: string
}

const defaultForm: FormData = { name: '', slug: '', description: '', short_description: '', status: 'draft', brand_id: '', category_id: '' }

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = productId !== undefined

  const [form, setForm] = useState<FormData>(defaultForm)
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get<{ data: Brand[] }>('/api/brands').then((r) => r.data.data),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories').then((r) => r.data.data),
  })

  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get<ApiResponse<Product>>(`/api/products/${productId}`).then((r) => r.data.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (productData) {
      setForm({
        name: productData.name,
        slug: productData.slug,
        description: productData.description ?? '',
        short_description: productData.short_description ?? '',
        status: productData.status,
        brand_id: productData.brand?.id?.toString() ?? '',
        category_id: productData.category?.id?.toString() ?? '',
      })
      setVariants(productData.variants ?? [])
    }
  }, [productData])

  const mutation = useMutation({
    mutationFn: (payload: object) =>
      isEdit ? api.put<ApiResponse<Product>>(`/api/products/${productId}`, payload) : api.post<ApiResponse<Product>>('/api/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      router.push('/dashboard/products')
    },
    onError: (err: unknown) => {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi.')
    },
  })

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc'
    if (!form.slug.trim()) newErrors.slug = 'Slug là bắt buộc'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    mutation.mutate({
      ...form,
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      variants: variants.map((v) => ({ ...v, selling_price: Number(v.selling_price), original_price: Number(v.original_price), quantity: Number(v.quantity) })),
    })
  }

  const inputClass = (key: keyof FormData) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
          <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.slug === slugify(p.name) || !p.slug ? slugify(e.target.value) : p.slug }))} className={inputClass('name')} placeholder="Nhập tên sản phẩm" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug *</label>
          <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputClass('slug')} />
          {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả ngắn</label>
          <textarea value={form.short_description} onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))} rows={2} className={inputClass('short_description')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={5} className={inputClass('description')} />
          <AIDescriptionGenerator
            productInfo={{
              name: form.name,
              brand: brandsData?.find((b) => b.id.toString() === form.brand_id)?.name,
              category: categoriesData?.find((c) => c.id.toString() === form.category_id)?.name,
            }}
            onGenerated={(desc) => setForm((p) => ({ ...p, description: desc }))}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700">Phân loại</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái *</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as FormData['status'] }))} className={inputClass('status')}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Thương hiệu</label>
            <select value={form.brand_id} onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value }))} className={inputClass('brand_id')}>
              <option value="">-- Chọn thương hiệu --</option>
              {(brandsData ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Danh mục</label>
            <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className={inputClass('category_id')}>
              <option value="">-- Chọn danh mục --</option>
              {(categoriesData ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <VariantManager variants={variants} onChange={setVariants} />
      </div>

      <SeoPanel
        productName={form.name}
        brandName={brandsData?.find((b) => b.id.toString() === form.brand_id)?.name}
        categoryName={categoriesData?.find((c) => c.id.toString() === form.category_id)?.name}
        description={form.description}
      />

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.push('/dashboard/products')} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
        <button type="submit" disabled={mutation.isPending} className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo sản phẩm'}
        </button>
      </div>
    </form>
  )
}
