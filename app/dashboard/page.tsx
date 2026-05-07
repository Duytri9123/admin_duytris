'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
  ArrowRight, Clock, CheckCircle, XCircle, Loader2, AlertCircle,
  Star, Bell, FileText, Image as ImageIcon
} from 'lucide-react'
import api from '@/lib/api-client'
import type { PaginatedResponse, Order } from '@/types'

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, color, href, loading,
}: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; href?: string; loading?: boolean
}) {
  const inner = (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
        {href && <ArrowRight size={14} className="text-gray-300 mt-1" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">
        {loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-gray-500">{title}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const ORDER_STATUS: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:    { label: 'Chờ xử lý',  bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  processing: { label: 'Đang xử lý', bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Loader2 },
  shipped:    { label: 'Đang giao',  bg: 'bg-purple-100', text: 'text-purple-700', icon: TrendingUp },
  delivered:  { label: 'Đã giao',    bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
  cancelled:  { label: 'Đã hủy',     bg: 'bg-red-100',    text: 'text-red-600',    icon: XCircle },
}

function OrderStatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ─── Quick links ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { href: '/dashboard/products/new', label: 'Thêm sản phẩm', icon: Package, color: 'bg-indigo-100 text-indigo-600' },
  { href: '/dashboard/banners',      label: 'Quản lý banner', icon: ImageIcon, color: 'bg-pink-100 text-pink-600' },
  { href: '/dashboard/posts',        label: 'Bài viết',       icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { href: '/dashboard/notifications',label: 'Thông báo',      icon: Bell, color: 'bg-orange-100 text-orange-600' },
  { href: '/dashboard/reviews',      label: 'Đánh giá',       icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  { href: '/dashboard/orders',       label: 'Đơn hàng',       icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
]

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  // Một query duy nhất lấy tất cả stats — tránh 4 API calls riêng lẻ
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => api.get<any>('/api/admin/analytics/summary').then((r) => r.data),
    staleTime: 5 * 60 * 1000,  // Cache 5 phút
  })

  // Orders riêng vì cần danh sách chi tiết
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: () => api.get<PaginatedResponse<Order>>('/api/admin/orders', { per_page: 8 }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const recentOrders = ordersData?.data?.slice(0, 8) ?? []
  const totalRevenue  = analyticsData?.total_revenue   ?? 0
  const totalOrders   = analyticsData?.total_orders    ?? 0
  const totalProducts = analyticsData?.total_products  ?? 0
  const totalUsers    = analyticsData?.total_users     ?? 0
  const recentRevenue = analyticsData?.recent_revenue  ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Tổng quan hoạt động cửa hàng</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Doanh thu" icon={DollarSign} color="bg-indigo-100 text-indigo-600"
          value={isLoading ? '...' : totalRevenue > 0 ? `${totalRevenue.toLocaleString('vi-VN')}₫` : '0₫'}
          sub={recentRevenue > 0 ? `+${recentRevenue.toLocaleString('vi-VN')}₫ tháng này` : undefined}
          loading={isLoading}
          href="/dashboard/analytics"
        />
        <StatCard
          title="Đơn hàng" icon={ShoppingCart} color="bg-green-100 text-green-600"
          value={totalOrders} loading={isLoading}
          href="/dashboard/orders"
        />
        <StatCard
          title="Sản phẩm" icon={Package} color="bg-blue-100 text-blue-600"
          value={totalProducts} loading={isLoading}
          href="/dashboard/products"
        />
        <StatCard
          title="Người dùng" icon={Users} color="bg-orange-100 text-orange-600"
          value={totalUsers} loading={isLoading}
          href="/dashboard/users"
        />
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Thao tác nhanh</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_LINKS.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-3 text-center hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-[11px] font-medium text-gray-600 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Đơn hàng gần đây</h2>
          <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Xem tất cả <ArrowRight size={12} />
          </Link>
        </div>

        {loadingOrders ? (          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart size={36} className="mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Ngày đặt</th>
                  <th className="px-5 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">#{order.id}</td>
                    <td className="px-5 py-3 text-gray-600">{(order as any).user?.name ?? '—'}</td>
                    <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 font-medium text-indigo-600">
                      {order.total_amount?.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                        Xem
                      </Link>
                    </td>
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
