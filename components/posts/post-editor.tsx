'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Globe, Lock } from 'lucide-react'
import api from '@/lib/api-client'
import { QuillEditor } from '@/components/ui/quill-editor'

interface PostForm {
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'published' | 'draft'
  category: string
  meta_title: string
  meta_description: string
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

const defaultForm: PostForm = {
  title: '', slug: '', excerpt: '', content: '',
  status: 'draft', category: '', meta_title: '', meta_description: '',
}

interface PostEditorProps {
  postId?: number
}

export function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = postId !== undefined
  const thumbRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<PostForm>(defaultForm)
  const [thumbnail, setThumbnail] = useState<string>('')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<PostForm>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')

  const { data: postData } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get<any>(`/api/admin/posts/${postId}`).then((r) => r.data.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (postData) {
      setForm({
        title: postData.title ?? '',
        slug: postData.slug ?? '',
        excerpt: postData.excerpt ?? '',
        content: postData.content ?? '',
        status: postData.status ?? 'draft',
        category: postData.category ?? '',
        meta_title: postData.meta_title ?? '',
        meta_description: postData.meta_description ?? '',
      })
      if (postData.thumbnail_url) setThumbnail(postData.thumbnail_url)
    }
  }, [postData])

  const mutation = useMutation({
    mutationFn: async (status: 'published' | 'draft') => {
      const payload = { ...form, status }
      if (isEdit) {
        return api.put(`/api/admin/posts/${postId}`, payload)
      }
      return api.post('/api/admin/posts', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      router.push('/dashboard/posts')
    },
    onError: (err: any) => setServerError(err?.response?.data?.message ?? 'Đã xảy ra lỗi'),
  })

  const validate = () => {
    const errs: Partial<PostForm> = {}
    if (!form.title.trim()) errs.title = 'Tiêu đề là bắt buộc'
    if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (status: 'published' | 'draft') => {
    setServerError(null)
    if (!validate()) return
    mutation.mutate(status)
  }

  const inp = (key: keyof PostForm) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main editor */}
      <div className="space-y-5 lg:col-span-2">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({
                ...p,
                title: e.target.value,
                slug: p.slug === slugify(p.title) || !p.slug ? slugify(e.target.value) : p.slug,
                meta_title: !p.meta_title ? e.target.value : p.meta_title,
              }))}
              placeholder="Tiêu đề bài viết..."
              className="w-full border-0 border-b border-gray-200 pb-3 text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className={`${inp('slug')} font-mono text-xs`}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-4">
              {(['content', 'seo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'content' ? 'Nội dung' : 'SEO'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'content' ? (
            <>
              {/* Excerpt */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tóm tắt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="Mô tả ngắn về bài viết..."
                  className={inp('excerpt')}
                />
              </div>

              {/* Content */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nội dung</label>
                <QuillEditor
                  value={form.content}
                  onChange={(val) => setForm((p) => ({ ...p, content: val }))}
                  placeholder="Viết nội dung bài viết ở đây..."
                  minHeight={400}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Title</label>
                <input
                  value={form.meta_title}
                  onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
                  className={inp('meta_title')}
                  placeholder="Tiêu đề SEO (tối đa 60 ký tự)"
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-gray-400">{form.meta_title.length}/60 ký tự</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
                  rows={3}
                  className={inp('meta_description')}
                  placeholder="Mô tả SEO (tối đa 160 ký tự)"
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-400">{form.meta_description.length}/160 ký tự</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Publish */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Xuất bản</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleSubmit('published')}
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Globe size={14} /> {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật & Đăng' : 'Đăng bài'}
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Lock size={14} /> Lưu nháp
            </button>
            <button
              onClick={() => router.push('/dashboard/posts')}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Hủy
            </button>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Ảnh đại diện</h3>
          <div
            onClick={() => thumbRef.current?.click()}
            className="cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
            style={{ aspectRatio: '16/9' }}
          >
            {thumbnail ? (
              <img src={thumbnail} alt="thumbnail" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                <Upload size={24} />
                <p className="text-xs">Click để tải ảnh</p>
              </div>
            )}
          </div>
          <input
            ref={thumbRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { setThumbFile(f); setThumbnail(URL.createObjectURL(f)) }
            }}
          />
        </div>

        {/* Category */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Danh mục</h3>
          <input
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Tin tức, Hướng dẫn..."
          />
        </div>
      </div>
    </div>
  )
}
