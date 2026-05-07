'use client'

import { useEffect, useState } from 'react'
import { supportTicketAdminApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface Ticket {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  user: {
    id: number
    name: string
    email: string
  }
  replies: any[]
  created_at: string
  resolved_at?: string
}

interface DetailProps {
  ticketId: number
}

const statusConfig = {
  open: { label: 'Mở', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800' },
}

export function SupportTicketDetailAdmin({ ticketId }: DetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  const loadTicket = async () => {
    setLoading(true)
    try {
      const response = await supportTicketAdminApi.getTicketDetail(ticketId)
      setTicket(response.data.data)
    } catch (error) {
      console.error('Failed to load ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await supportTicketAdminApi.updateTicketStatus(ticketId, newStatus)
      toast({
        title: 'Thành công',
        description: 'Cập nhật trạng thái thành công',
      })
      loadTicket()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="text-center py-8">Đang tải...</div>
  if (!ticket) return <div className="text-center py-8">Không tìm thấy phiếu</div>

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
            <p className="text-gray-600">{ticket.description}</p>
          </div>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">Mở</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Người tạo</p>
            <p className="font-semibold">{ticket.user.name}</p>
            <p className="text-gray-600">{ticket.user.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Loại</p>
            <p className="font-semibold">{ticket.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Độ ưu tiên</p>
            <p className="font-semibold">{ticket.priority}</p>
          </div>
          <div>
            <p className="text-gray-500">Ngày tạo</p>
            <p className="font-semibold">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">Phản hồi ({ticket.replies.length})</h2>
        <div className="space-y-3">
          {ticket.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{reply.user.name}</p>
                  <p className="text-sm text-gray-500">{reply.user.email}</p>
                </div>
                {reply.user.isAdmin && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Admin</span>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(reply.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
