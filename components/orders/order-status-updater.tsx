'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrderStatus } from '@/types'
import api from '@/lib/api-client'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

interface Props {
  orderId: number
  currentStatus: OrderStatus
}

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [selected, setSelected] = useState<OrderStatus>(currentStatus)
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newStatus: OrderStatus) => api.put(`/api/admin/orders/${orderId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      setToast({ type: 'success', message: 'Cập nhật trạng thái thành công' })
      setTimeout(() => setToast(null), 3000)
      setConfirming(false)
    },
    onError: () => {
      setToast({ type: 'error', message: 'Cập nhật thất bại. Vui lòng thử lại.' })
      setTimeout(() => setToast(null), 3000)
      setConfirming(false)
    },
  })

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as OrderStatus)}
        disabled={mutation.isPending}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
      >
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      {selected !== currentStatus && !confirming && (
        <button onClick={() => setConfirming(true)} className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Cập nhật trạng thái
        </button>
      )}

      {confirming && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="mb-2 text-amber-800">Xác nhận đổi sang <strong>{STATUS_LABELS[selected]}</strong>?</p>
          <div className="flex gap-2">
            <button onClick={() => mutation.mutate(selected)} disabled={mutation.isPending} className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
            </button>
            <button onClick={() => { setConfirming(false); setSelected(currentStatus) }} disabled={mutation.isPending} className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Hủy
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`rounded-md border px-3 py-2 text-sm font-medium ${toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
