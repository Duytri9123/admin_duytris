'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { AIAnalysisPanel } from '@/components/analytics/ai-analysis-panel'
import type { RevenueData } from '@/types'

type Period = 'week' | 'month' | 'quarter' | 'year'

interface RevenuePoint {
  date: string
  revenue: number
}

interface BestSellingProduct {
  id: number
  name: string
  total_sold: number
  total_revenue: number
}

interface AnalyticsData {
  revenue_by_period: RevenuePoint[]
  best_selling_products: BestSellingProduct[]
  total_revenue: number
  order_count: number
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Tuần', value: 'week' },
  { label: 'Tháng', value: 'month' },
  { label: 'Quý', value: 'quarter' },
  { label: 'Năm', value: 'year' },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () =>
      api.get<{ data: AnalyticsData }>('/api/admin/analytics', { period }).then((r) => r.data.data),
  })

  const fmt = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Phân tích doanh thu</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${period === p.value ? 'bg-indigo-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng doanh thu</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {isLoading ? '...' : data ? fmt(data.total_revenue) : 'N/A'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Số đơn hàng</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {isLoading ? '...' : data?.order_count ?? 'N/A'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Biểu đồ doanh thu</h2>
        {isLoading && <div className="flex h-64 items-center justify-center text-sm text-gray-500">Đang tải...</div>}
        {isError && <div className="flex h-64 items-center justify-center text-sm text-red-500">Không thể tải dữ liệu</div>}
        {data && <RevenueChart data={data.revenue_by_period} />}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Sản phẩm bán chạy</h2>
        </div>
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Đang tải...</div>
        ) : !data?.best_selling_products?.length ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3">Đã bán</th>
                  <th className="px-6 py-3">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.best_selling_products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-gray-700">{product.total_sold}</td>
                    <td className="px-6 py-4 text-gray-700">{fmt(product.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && (
        <AIAnalysisPanel
          revenueData={{
            period,
            orders: [],
            total_revenue: data.total_revenue,
            order_count: data.order_count,
          } satisfies RevenueData}
        />
      )}
    </div>
  )
}
