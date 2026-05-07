'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'
import {
  DollarSign, ShoppingCart, Package, TrendingUp, TrendingDown,
  Users, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

type Period = 'week' | 'month' | 'quarter' | 'year'

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Tuần', value: 'week' },
  { label: 'Tháng', value: 'month' },
  { label: 'Quý', value: 'quarter' },
  { label: 'Năm', value: 'year' },
]

function fmt(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)
}

function StatCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub?: string
  icon: React.ElementType; color: string; trend?: number
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{title}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// Simple bar chart using CSS
function SimpleBarChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  if (!data?.length) return <div className="flex h-48 items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1.5 h-48">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
              <div
                className="w-full rounded-t-sm bg-indigo-500 hover:bg-indigo-600 transition-colors cursor-pointer"
                style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%` }}
                title={`${d.date}: ${fmt(d.revenue)}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-gray-400 truncate">
            {d.date.slice(5)} {/* MM-DD */}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsPage() {
  const [state, setState] = useTableState({ period: 'month' as Period })
  const { period } = state

  // Summary stats — cache 10 phút, gcTime 60 phút
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get<any>('/api/admin/analytics/summary').then(r => r.data),
    // Dùng default staleTime/gcTime từ QueryClient (10 phút / 60 phút)
  })

  const dailyRevenue = summary?.daily_revenue ?? []
  const topProducts = summary?.top_products ?? []
  const ordersByStatus = summary?.orders_by_status ?? {}

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xử lý', processing: 'Đang xử lý',
    shipped: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
  }
  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-400', processing: 'bg-blue-400',
    shipped: 'bg-purple-400', delivered: 'bg-green-400', cancelled: 'bg-red-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
          <p className="mt-0.5 text-sm text-gray-500">Tổng quan doanh thu và hoạt động cửa hàng</p>
        </div>
        <div className="ml-auto flex rounded-lg border border-gray-200 bg-white p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setState({ period: p.value })}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${period === p.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Tổng doanh thu" icon={DollarSign} color="bg-indigo-100 text-indigo-600"
          value={loadingSummary ? '...' : fmt(summary?.total_revenue ?? 0)}
          sub={summary?.recent_revenue > 0 ? `+${fmt(summary.recent_revenue)} tháng này` : undefined}
          trend={summary?.revenue_growth} />
        <StatCard title="Đơn hàng" icon={ShoppingCart} color="bg-green-100 text-green-600"
          value={loadingSummary ? '...' : String(summary?.total_orders ?? 0)} />
        <StatCard title="Sản phẩm" icon={Package} color="bg-blue-100 text-blue-600"
          value={loadingSummary ? '...' : String(summary?.total_products ?? 0)} />
        <StatCard title="Người dùng" icon={Users} color="bg-orange-100 text-orange-600"
          value={loadingSummary ? '...' : String(summary?.total_users ?? 0)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Doanh thu 7 ngày gần nhất</h2>
          {loadingSummary ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <SimpleBarChart data={dailyRevenue} />
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Đơn hàng theo trạng thái</h2>
          {loadingSummary ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />)}
            </div>
          ) : Object.keys(ordersByStatus).length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(ordersByStatus).map(([status, count]) => {
                const total = Object.values(ordersByStatus).reduce((a: number, b) => a + Number(b), 0)
                const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{STATUS_LABELS[status] ?? status}</span>
                      <span className="text-gray-500">{String(count)} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Sản phẩm bán chạy</h2>
        </div>
        {loadingSummary ? (
          <div className="p-5 space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
          </div>
        ) : !topProducts.length ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            <BarChart3 size={32} className="mx-auto mb-2 text-gray-300" />
            Chưa có dữ liệu bán hàng
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-5 py-3">Đã bán</th>
                  <th className="px-5 py-3">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((p: any, i: number) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-gray-600">{p.total_sold}</td>
                    <td className="px-5 py-3 font-medium text-indigo-600">{fmt(p.revenue ?? 0)}</td>
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

// Wrap với Suspense vì useTableState dùng useSearchParams
export default function AnalyticsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Đang tải...</div>}>
      <AnalyticsPage />
    </Suspense>
  )
}
