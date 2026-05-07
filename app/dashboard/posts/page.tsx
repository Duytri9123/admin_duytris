'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  FileText, Plus, Pencil, Trash2, Eye, EyeOff, Search,
  Calendar, Tag, Globe, Lock
} from 'lucide-react'
import api from '@/lib/api-client'
import type { PaginatedResponse } from '@/types'

interface Post {
  id: number
  title: string
  slug: string
  excerpt?: string
  thumbnail_url?: string
  status: 'published' | 'draft' | 'archived'
  category?: string
  views_count?: number
  created_at: string
  updated_at: string
}

const STATUS_MAP = {
  published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã đăng', icon: Globe },
  draft:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Nháp', icon: Lock },
  archived:  { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Lưu trữ', icon: EyeOff },
}

export default function PostsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', page, search, statusFilter],
    queryFn: () =>
      api.get<PaginatedResponse<Post>>('/api/admin/posts', {
        page,
        per_page: 12,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/posts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/api/admin/posts/${id}`, { status: status === 'published' ? 'draft' : 'published' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  const posts = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bài viết</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý blog và tin tức</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Viết bài mới
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm bài viết..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Tìm</button>
        </form>

        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          {(['all', 'published', 'draft', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {s === 'all' ? 'Tất cả' : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <FileText size={40} className="mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">{search ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}</p>
          {!search && (
            <Link href="/dashboard/posts/new" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              + Viết bài đầu tiên
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const s = STATUS_MAP[post.status] ?? STATUS_MAP.draft
            const StatusIcon = s.icon
            return (
              <div key={post.id} className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  {post.thumbnail_url ? (
                    <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText size={36} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      <StatusIcon size={9} /> {s.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">{post.title}</h3>
                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 leading-relaxed">{post.excerpt}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Calendar size={10} />
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                      {post.views_count !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Eye size={10} /> {post.views_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleMutation.mutate({ id: post.id, status: post.status })}
                        className={`rounded p-1.5 transition-colors ${post.status === 'published' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={post.status === 'published' ? 'Ẩn bài' : 'Đăng bài'}
                      >
                        {post.status === 'published' ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <Link href={`/dashboard/posts/${post.id}/edit`} className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50">
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => { if (confirm('Xóa bài viết này?')) deleteMutation.mutate(post.id) }}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="text-xs">Trang {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">← Trước</button>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Sau →</button>
          </div>
        </div>
      )}
    </div>
  )
}
