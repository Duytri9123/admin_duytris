'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { supportTicketAdminApi } from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'

interface Ticket {
  id: number
  title: string
  category: string
  priority: string
  status: string
  user: {
    id: number
    name: string
    email: string
  }
  created_at: string
  replies_count: number
}

const statusConfig = {
  open: { label: 'Mở', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800' },
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
}

function SupportTicketTableInner() {
  // Persist filter vào URL — quay lại trang vẫn giữ filter, React Query dùng cache
  const [state, setState] = useTableState({
    status: '',
    category: '',
    priority: '',
    search: '',
  })

  const { status, category, priority, search } = state

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support-tickets', status, category, priority, search],
    queryFn: () =>
      supportTicketAdminApi.getTickets({
        status: status || undefined,
        category: category || undefined,
        priority: priority || undefined,
        search: search || undefined,
      }).then((r: any) => r.data),
  })

  const tickets: Ticket[] = data?.data ?? data ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setState({ search: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setState({ status: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="open">Mở</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="closed">Đã đóng</option>
        </select>
        <select
          value={category}
          onChange={(e) => setState({ category: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          <option value="complaint">Phàn nàn</option>
          <option value="support">Hỗ trợ</option>
          <option value="report">Báo cáo</option>
          <option value="feedback">Phản hồi</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setState({ priority: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả độ ưu tiên</option>
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
          <option value="urgent">Khẩn cấp</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-gray-500">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Người tạo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Loại</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Độ ưu tiên</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Không có phiếu hỗ trợ nào
                  </td>
                </tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{ticket.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{ticket.user.name}</p>
                      <p className="text-gray-500 text-xs">{ticket.user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{ticket.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${priorityConfig[ticket.priority as keyof typeof priorityConfig]?.color}`}>
                      {priorityConfig[ticket.priority as keyof typeof priorityConfig]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusConfig[ticket.status as keyof typeof statusConfig]?.color}`}>
                      {statusConfig[ticket.status as keyof typeof statusConfig]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/dashboard/support/${ticket.id}`} className="text-blue-600 hover:underline">
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function SupportTicketTable() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-sm text-gray-500">Đang tải...</div>}>
      <SupportTicketTableInner />
    </Suspense>
  )
}
