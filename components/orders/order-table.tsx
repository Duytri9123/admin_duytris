'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Suspense } from 'react'
import api from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'
import type { Order, OrderStatus, PaginatedResponse } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function OrderTableInner() {
  // State được persist vào URL — khi quay lại trang, state được khôi phục
  // queryKey giống nhau → React Query dùng cache, không fetch lại
  const [state, setState] = useTableState({
    page: 1,
    status: '' as OrderStatus | '',
  })

  const { page, status: statusFilter } = state

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () =>
      api.get<PaginatedResponse<Order>>('/api/admin/orders', {
        page,
        per_page: 10,
        status: statusFilter || undefined,
      }).then((r) => r.data),
  })

  const orders = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
        <select
          value={statusFilter}
          onChange={(e) => setState({ status: e.target.value as OrderStatus | '' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>
        ) : isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">Không thể tải dữ liệu</div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Không có đơn hàng nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                  <td className="px-4 py-3 text-gray-600">{order.address?.full_name ?? `User #${order.user_id}`}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.total_amount.toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/orders/${order.id}`} className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Trang {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setState({ page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              onClick={() => setState({ page: Math.min(lastPage, page + 1) })}
              disabled={page === lastPage}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap với Suspense vì useSearchParams cần Suspense boundary trong Next.js App Router
export function OrderTable() {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>}>
      <OrderTableInner />
    </Suspense>
  )
}
