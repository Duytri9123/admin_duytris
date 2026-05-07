import { SupportTicketDetailAdmin } from '@/components/support/SupportTicketDetailAdmin'

export const metadata = {
  title: 'Chi tiết phiếu hỗ trợ',
  description: 'Xem chi tiết phiếu hỗ trợ',
}

interface TicketDetailPageProps {
  params: {
    id: string
  }
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticketId = parseInt(params.id)

  return (
    <div className="space-y-6">
      <div>
        <a href="/dashboard/support" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Quay lại
        </a>
        <h1 className="text-3xl font-bold">Chi tiết phiếu hỗ trợ</h1>
      </div>

      <SupportTicketDetailAdmin ticketId={ticketId} />
    </div>
  )
}
