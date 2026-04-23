import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Order, OrderStatus } from '@/types'
import OrderStatusUpdater from '@/components/orders/order-status-updater'
import OrderStatusUpdater from '@/components/orders/order-status-updater'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

async function getOrder(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_URL}/api/admin/orders/${id}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? json
  } catch {
    return null
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline">← Danh sách đơn hàng</Link>
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng #{order.id}</h1>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Sản phẩm</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-center">SL</th>
                  <th className="px-5 py-3 text-right">Đơn giá</th>
                  <th className="px-5 py-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{item.product_name}</td>
                    <td className="px-5 py-3 text-gray-500">{item.variant_sku ?? '—'}</td>
                    <td className="px-5 py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{item.price.toLocaleString('vi-VN')}₫</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-right font-semibold text-gray-700">Tổng cộng</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">{order.total_amount.toLocaleString('vi-VN')}₫</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-900">Địa chỉ giao hàng</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.address.full_name}</p>
              <p>{order.address.phone}</p>
              <p>{order.address.street}, {order.address.ward}, {order.address.district}, {order.address.province}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-900">Cập nhật trạng thái</h2>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-900">Thông tin đơn hàng</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Ngày tạo</dt>
                <dd className="text-gray-900">{new Date(order.created_at).toLocaleDateString('vi-VN')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Cập nhật</dt>
                <dd className="text-gray-900">{new Date(order.updated_at).toLocaleDateString('vi-VN')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
