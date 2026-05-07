'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { VariantManager } from './variant-manager'
import { SeoPanel } from './seo-panel'
import { AIDescriptionGenerator } from './ai-description-generator'
import { CategorySelector } from '../categories/category-selector'
import { QuillEditor } from '@/components/ui/quill-editor'
import type { Brand, Category, Product, ProductVariant, ApiResponse } from '@/types'

// ─── Draft helpers ────────────────────────────────────────────────────────────
const DRAFT_KEY = 'product_form_draft'

interface FormFields {
  name: string
  slug: string
  description: string
  short_description: string
  status: 'active' | 'inactive' | 'draft'
  brand_id: string
  category_id: string
}

interface DraftData {
  form: FormFields
  variants: Partial<ProductVariant>[]
  images: LocalImage[]
  step: number
  savedAt: number
}

interface LocalImage {
  id: string
  url: string
  isCover: boolean
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DraftData
  } catch { return null }
}
function saveDraft(d: DraftData) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}
function clearDraft() { localStorage.removeItem(DRAFT_KEY) }
function fmtDraftTime(ts: number) {
  return new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Step nav ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Thông tin' },
  { id: 2, label: 'Phân loại' },
  { id: 3, label: 'Biến thể' },
  { id: 4, label: 'SEO' },
]

function StepNav({ cur, max, onGo }: { cur: number; max: number; onGo: (s: number) => void }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((s, i) => {
        const done = s.id < cur
        const active = s.id === cur
        const locked = s.id > max
        const last = i === STEPS.length - 1
        return (
          <div key={s.id} className={`flex items-center ${last ? '' : 'flex-1'}`}>
            <button
              type="button"
              onClick={() => !locked && onGo(s.id)}
              disabled={locked}
              className="flex flex-col items-center gap-1 min-w-[52px] outline-none"
            >
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done ? 'bg-indigo-600 text-white' : active ? 'bg-white border-2 border-indigo-600 text-indigo-600' : 'bg-gray-100 border-2 border-gray-200 text-gray-400',
              ].join(' ')}>
                {done ? '✓' : s.id}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${done || active ? 'text-indigo-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </button>
            {!last && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all ${s.id < cur ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMG_LIMIT = 5

function uid() { return Math.random().toString(36).slice(2) }

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

const defaultForm: FormFields = {
  name: '', slug: '', description: '', short_description: '', status: 'draft', brand_id: '', category_id: '',
}

// ─── Main component ───────────────────────────────────────────────────────────
interface ProductFormProps {
  productId?: number
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = productId !== undefined

  const [step, setStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [form, setForm] = useState<FormFields>(defaultForm)
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([])
  const [images, setImages] = useState<LocalImage[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [draftPrompt, setDraftPrompt] = useState<DraftData | null>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const isFirstRender = useRef(true)

  // ── Queries ──
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

  // ── Load product for edit ──
  useEffect(() => {
    if (!productData) return
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
    if (productData.images?.length) {
      setImages(productData.images.map((img, i) => ({ id: String(img.id), url: img.url, isCover: img.is_thumbnail || i === 0 })))
    }
  }, [productData])

  // ── Draft: check on mount (new product only) ──
  useEffect(() => {
    if (isEdit) return
    const draft = loadDraft()
    if (draft && draft.form.name.trim()) setDraftPrompt(draft)
  }, [isEdit])

  // ── Draft: auto-save ──
  useEffect(() => {
    if (isEdit) return
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (draftPrompt) return
    saveDraft({ form, variants, images, step, savedAt: Date.now() })
  }, [form, variants, images, step, isEdit, draftPrompt])

  // ── Mutation ──
  const mutation = useMutation({
    mutationFn: async (payload: object) => {
      // Upload images first if any are blob URLs (new images)
      const blobImages = images.filter(img => img.url.startsWith('blob:'))
      const uploadedUrls: Record<string, string> = {}

      for (const img of blobImages) {
        try {
          const blob = await fetch(img.url).then(r => r.blob())
          const fd = new FormData()
          fd.append('image', blob, `product-${Date.now()}.jpg`)
          const { data } = await api.post('/api/admin/upload-image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          uploadedUrls[img.id] = data.url
        } catch {
          // Keep blob URL if upload fails — backend will ignore it
        }
      }

      // Build final images array with uploaded URLs
      const finalImages = images.map(img => ({
        url: uploadedUrls[img.id] ?? img.url,
        is_thumbnail: img.isCover,
      }))

      const finalPayload = { ...payload, images: finalImages }

      return isEdit
        ? api.put<ApiResponse<Product>>(`/api/products/${productId}`, finalPayload)
        : api.post<ApiResponse<Product>>('/api/products', finalPayload)
    },
    onSuccess: () => {
      clearDraft()
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      router.push('/dashboard/products')
    },
    onError: (err: unknown) => {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi.')
    },
  })

  // ── Validation per step ──
  const validateStep = (s: number): boolean => {
    const errs: Partial<Record<keyof FormFields, string>> = {}
    if (s === 1) {
      if (!form.name.trim()) errs.name = 'Tên sản phẩm là bắt buộc'
      if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc'
    }
    if (s === 2) {
      if (!form.status) errs.status = 'Vui lòng chọn trạng thái'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goTo = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    if (!validateStep(step)) return
    const nxt = Math.min(4, step + 1)
    setStep(nxt)
    setMaxStep((p) => Math.max(p, nxt))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = () => {
    if (!validateStep(step)) return
    setServerError(null)
    mutation.mutate({
      ...form,
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      variants: variants.map((v) => ({
        ...v,
        selling_price: Number(v.selling_price),
        original_price: Number(v.original_price),
        quantity: Number(v.quantity),
      })),
    })
  }

  // ── Image handlers ──
  const handleAddImages = (files: FileList) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, IMG_LIMIT - images.length)
    if (!arr.length) return
    const newImgs: LocalImage[] = arr.map((f, i) => ({
      id: uid(),
      url: URL.createObjectURL(f),
      isCover: images.length === 0 && i === 0,
    }))
    setImages((prev) => {
      const merged = [...prev, ...newImgs]
      if (!merged.some((img) => img.isCover)) merged[0].isCover = true
      return merged
    })
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id)
      if (next.length && !next.some((img) => img.isCover)) next[0].isCover = true
      return next
    })
  }

  const setCover = (id: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isCover: img.id === id })))
  }

  // ── Input class helper ──
  const inp = (key: keyof FormFields) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`

  const brandName = brandsData?.find((b) => b.id.toString() === form.brand_id)?.name
  const categoryName = categoriesData?.find((c) => c.id.toString() === form.category_id)?.name

  return (
    <div className="space-y-5">
      {/* Draft restore prompt */}
      {draftPrompt && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-800">
            Bạn có bản nháp chưa hoàn thành từ {fmtDraftTime(draftPrompt.savedAt)}
          </p>
          <p className="mt-0.5 text-xs text-indigo-600">
            📝 <strong>{draftPrompt.form.name || 'Chưa đặt tên'}</strong> · Bước {draftPrompt.step}/4
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => { clearDraft(); setDraftPrompt(null) }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Bỏ nháp
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(draftPrompt.form)
                setVariants(draftPrompt.variants)
                setImages(draftPrompt.images ?? [])
                setStep(draftPrompt.step)
                setMaxStep(draftPrompt.step)
                setDraftPrompt(null)
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Tiếp tục chỉnh sửa →
            </button>
          </div>
        </div>
      )}

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      {/* Step nav */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <StepNav cur={step} max={maxStep} onGo={goTo} />

        {/* ── Step 1: Thông tin cơ bản ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h2>

            {/* Tên sản phẩm */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  name: e.target.value,
                  slug: p.slug === slugify(p.name) || !p.slug ? slugify(e.target.value) : p.slug,
                }))}
                className={inp('name')}
                placeholder="Nhập tên sản phẩm"
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
              />
              {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
            </div>

            {/* Ảnh sản phẩm */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Ảnh sản phẩm</label>
                <span className="text-xs text-gray-400">{images.length}/{IMG_LIMIT}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setCover(img.id)}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${img.isCover ? 'border-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    {img.isCover && (
                      <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Bìa</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs text-red-500 shadow hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {images.length < IMG_LIMIT && (
                  <button
                    type="button"
                    onClick={() => imgRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-lg">+</span>
                    <span className="text-[10px] font-medium">Thêm ảnh</span>
                  </button>
                )}
              </div>
              {images.length > 0 && (
                <p className="mt-1.5 text-xs text-gray-400">Click vào ảnh để đặt làm ảnh bìa</p>
              )}
              <input
                ref={imgRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) handleAddImages(e.target.files); e.target.value = '' }}
              />
            </div>

            {/* Mô tả ngắn */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả ngắn</label>
              <textarea
                value={form.short_description}
                onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                rows={2}
                className={inp('short_description')}
              />
            </div>

            {/* Mô tả chi tiết */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
              <QuillEditor
                value={form.description}
                onChange={(val) => setForm((p) => ({ ...p, description: val }))}
                placeholder="Nhập mô tả chi tiết sản phẩm..."
                minHeight={250}
              />
              <AIDescriptionGenerator
                productInfo={{ name: form.name, brand: brandName, category: categoryName }}
                onGenerated={(desc) => setForm((p) => ({ ...p, description: desc }))}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Phân loại ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Phân loại</h2>
            
            {/* Category selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Danh mục</label>
              <CategorySelector
                categories={categoriesData ?? []}
                selectedId={form.category_id ? Number(form.category_id) : null}
                onSelect={(id) => setForm((p) => ({ ...p, category_id: id.toString() }))}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as FormFields['status'] }))}
                  className={inp('status')}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Thương hiệu</label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value }))}
                  className={inp('brand_id')}
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {(brandsData ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Biến thể ── */}
        {step === 3 && (
          <VariantManager variants={variants} onChange={setVariants} />
        )}

        {/* ── Step 4: SEO ── */}
        {step === 4 && (
          <SeoPanel
            productName={form.name}
            brandName={brandName}
            categoryName={categoryName}
            description={form.description}
          />
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/products')}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Hủy
        </button>

        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Tiếp tục →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo sản phẩm'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
