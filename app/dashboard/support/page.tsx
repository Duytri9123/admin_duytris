import { SupportTicketStats } from '@/components/support/SupportTicketStats'
import { SupportTicketTable } from '@/components/support/SupportTicketTable'

export const metadata = {
  title: 'Quản lý phiếu hỗ trợ',
  description: 'Quản lý tất cả phiếu hỗ trợ',
}

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý phiếu hỗ trợ</h1>
        <p className="text-gray-600">Quản lý tất cả phiếu hỗ trợ, phàn nàn và báo cáo từ khách hàng</p>
      </div>

      <SupportTicketStats />
      <SupportTicketTable />
    </div>
  )
}
