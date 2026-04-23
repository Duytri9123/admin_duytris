'use client'

import { OrderTable } from '@/components/orders/order-table'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
      <OrderTable />
    </div>
  )
}
