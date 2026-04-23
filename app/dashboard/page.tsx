import { StatsCard } from '@/components/analytics/stats-card'
import type { PaginatedResponse, Product, Order } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchStats() {
  const headers = { Accept: 'application/json' }

  const [productsRes, ordersRes] = await Promise.allSettled([
    fetch(`${API_URL}/api/products?per_page=1`, { headers, cache: 'no-store', credentials: 'include' }),
    fetch(`${API_URL}/api/admin/orders?per_page=5`, { headers, cache: 'no-store', credentials: 'include' }),
  ])

  let totalProducts: string | number = 'N/A'
  let totalOrders: string | number = 'N/A'
  let recentOrders: Order[] = []

  if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
    const data: PaginatedResponse<Product> = await productsRes.value.json()
    totalProducts = data.total ?? 'N/A'
  }

  if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
    const data: PaginatedResponse<Order> = await ordersRes.value.json()
    totalOrders = data.total ?? 'N/A'
    recentOrders = data.data?.slice(0, 5) ?? []
  }

  return { totalProducts, totalOrders, recentOrders }
}

function statusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-700'
    case 'processing': return 'bg-blue-100 text-blue-700'
    case 'shipped': return 'bg-purple-100 text-purple-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

export default async function DashboardPage() {
  const { totalProducts, totalOrders, recentOrders } = await fetchStats()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Doanh thu" value="N/A" />
        <StatsCard title="Đơn hàng" value={totalOrders} />
        <StatsCard title="Sản phẩm" value={totalProducts} />
        <StatsCard title="Người dùng" value="N/A" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Chưa có đơn hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Mã đơn</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Tổng tiền</th>
                  <th className="px-6 py-3">Ngày đặt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{order.total_amount?.toLocaleString('vi-VN')}₫</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
