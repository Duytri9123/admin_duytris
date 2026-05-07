'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, Check, X, Trash2, Reply } from 'lucide-react'
import api from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'
import type { PaginatedResponse } from '@/types'

interface Review {
  id: number
  product_id: number
  product_name?: string
  user_name: string
  user_email?: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  reply?: string
  created_at: string
}

const STATUS_MAP = {
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ duyệt' },
  approved: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Đã duyệt'  },
  rejected: { bg: 'bg-red-100',    text: 'text-red-600',    label: 'Từ chối'   },
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={12} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-700">{rating}/5</span>
    </div>
  )
}

function ReplyModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState(review.reply ?? '')

  const mutation = useMutation({
    mutationFn: () => api.put(`/api/reviews/${review.id}/reply`, { reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">Phản hồi đánh giá</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Original review */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">{review.user_name}</span>
              <StarRow rating={review.rating} />
            </div>
            <p className="text-sm text-gray-600">{review.comment}</p>
          </div>

          {/* Reply input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Phản hồi của bạn</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Nhập phản hồi..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!reply.trim() || mutation.isPending}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewsPageInner() {
  const queryClient = useQueryClient()
  const [replyReview, setReplyReview] = useState<Review | null>(null)

  // Persist filter/page vào URL
  const [state, setState] = useTableState({
    page: 1,
    status: 'all',
    rating: 0,
  })
  const { page, status: statusFilter, rating: ratingFilter } = state

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, statusFilter, ratingFilter],
    queryFn: () =>
      api.get<PaginatedResponse<Review>>('/api/reviews', {
        page,
        per_page: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter > 0 ? ratingFilter : undefined,
      }).then((r) => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/reviews/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/reviews/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/reviews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  const reviews = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MessageSquare size={16} />
          <span>{data?.total ?? 0} đánh giá</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setState({ status: s })}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {s === 'all' ? 'Tất cả' : STATUS_MAP[s].label}
            </button>
          ))}
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-1">
          {[5,4,3,2,1].map((r) => (
            <button
              key={r}
              onClick={() => setState({ rating: ratingFilter === r ? 0 : r })}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                ratingFilter === r ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Star size={11} className={ratingFilter === r ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
            <MessageSquare size={40} className="mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Không có đánh giá nào</p>
          </div>
        ) : (
          reviews.map((review) => {
            const s = STATUS_MAP[review.status]
            return (
              <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                        {review.user_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{review.user_name}</span>
                      {review.user_email && (
                        <span className="text-xs text-gray-400">{review.user_email}</span>
                      )}
                      <StarRow rating={review.rating} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* Product */}
                    {review.product_name && (
                      <p className="mb-1.5 text-xs text-indigo-600 font-medium">📦 {review.product_name}</p>
                    )}

                    {/* Comment */}
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>

                    {/* Reply */}
                    {review.reply && (
                      <div className="mt-3 rounded-lg border-l-2 border-indigo-400 bg-indigo-50 pl-3 py-2">
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Phản hồi của cửa hàng:</p>
                        <p className="text-xs text-gray-700">{review.reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(review.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          <Check size={12} /> Duyệt
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(review.id)}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <X size={12} /> Từ chối
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setReplyReview(review)}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <Reply size={12} /> Phản hồi
                    </button>
                    <button
                      onClick={() => { if (confirm('Xóa đánh giá này?')) deleteMutation.mutate(review.id) }}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                    >
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="text-xs">Trang {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button onClick={() => setState({ page: Math.max(1, page - 1) })} disabled={page === 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">← Trước</button>
            <button onClick={() => setState({ page: Math.min(lastPage, page + 1) })} disabled={page === lastPage} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Sau →</button>
          </div>
        </div>
      )}

      {replyReview && (
        <ReplyModal review={replyReview} onClose={() => setReplyReview(null)} />
      )}
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Đang tải...</div>}>
      <ReviewsPageInner />
    </Suspense>
  )
}
