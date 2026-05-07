'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Brand, ApiResponse } from '@/types'

interface BrandFormProps {
  brandId?: number
}

interface FormFields {
  name: string
  slug: string
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function BrandForm({ brandId }: BrandFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = brandId !== undefined
  const logoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormFields>({ name: '', slug: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<FormFields>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const { data: brandData } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => api.get<ApiResponse<Brand>>(`/api/brands/${brandId}`).then((r) => r.data.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (brandData) {
      setForm({ name: brandData.name, slug: brandData.slug })
      if (brandData.logo) setLogoPreview(`${API}${brandData.logo}`)
    }
  }, [brandData])

  const mutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const url = isEdit ? `/api/brands/${brandId}?_method=PUT` : '/api/brands'
      const { getCsrfCookie, apiClient } = await import('@/lib/api-client')
      await getCsrfCookie()
      return apiClient.post<ApiResponse<Brand>>(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      router.push('/dashboard/brands')
    },
    onError: (err: unknown) => {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi.')
    },
  })

  const validate = () => {
    const errs: Partial<FormFields> = {}
    if (!form.name.trim()) errs.name = 'Tên thương hiệu là bắt buộc'
    if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('slug', form.slug)
    if (logoFile) fd.append('logo', logoFile)
    mutation.mutate(fd)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const inp = (key: keyof FormFields) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        {/* Logo */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Logo thương hiệu</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => logoRef.current?.click()}
              className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-2xl text-indigo-400">+</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <p>Click để chọn ảnh</p>
              <p className="mt-0.5 text-gray-400">PNG, JPG, SVG — tối đa 2MB</p>
              {logoPreview && (
                <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null) }} className="mt-1 text-red-500 hover:underline">Xóa ảnh</button>
              )}
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tên thương hiệu *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({
              ...p,
              name: e.target.value,
              slug: p.slug === slugify(p.name) || !p.slug ? slugify(e.target.value) : p.slug,
            }))}
            className={inp('name')}
            placeholder="Nhập tên thương hiệu"
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
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.push('/dashboard/brands')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Hủy
        </button>
        <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo thương hiệu'}
        </button>
      </div>
    </form>
  )
}
