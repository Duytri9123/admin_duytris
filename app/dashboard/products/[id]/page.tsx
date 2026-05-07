'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Trash2, Package, TrendingUp, Eye, ShoppingCart,
  DollarSign, Tag, Folder, Star, AlertCircle, CheckCircle,
  XCircle, Clock, BarChart3, Activity, ToggleLeft, ToggleRight
} from 'lucide-react'
import api from '@/lib/api-client'
import { ProductHealthCheck } from '@/components/products/product-health-check'
import type { Product, ApiResponse } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface PageProps {
  params: Promise<{ id: string }>
}

function statusBadge(status: string) {
  const map: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    active: { icon: <CheckCircle size={12} />, bg: 'bg-green-100', text: 'text-green-700', label: 'Hoạt động' },
    inactive: { icon: <XCircle size={12} />, bg: 'bg-gray-100', text: 'text-gray-600', label: 'Tạm dừng' },
    draft: { icon: <Clock size={12} />, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Nháp' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, trend, color = 'indigo' }: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  color?: string
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-500">{label}</p>
    </div>
  )
}

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = use(params)
  const productId = Number(id)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get<ApiResponse<Product>>(`/api/products/${productId}`).then((r) => r.data.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (status: string) =>
      api.put(`/api/products/${productId}`, { status: status === 'active' ? 'inactive' : 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 text-center">
        <AlertCircle size={40} className="mb-3 text-red-400" />
        <p className="text-sm font-medium text-red-600">Không thể tải thông tin sản phẩm</p>
        <button onClick={() => router.back()} className="mt-3 text-xs text-red-500 hover:underline">
          ← Quay lại
        </button>
      </div>
    )
  }

  const defaultVariant = product.variants?.find((v) => v.is_default) ?? product.variants?.[0]
  const thumbnail = product.images?.find((img) => img.is_thumbnail)?.url ?? product.images?.[0]?.url
  const variantCount = product.variants?.length ?? 0
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantity ?? 0), 0) ?? 0

  // Mock analytics data (replace with real API data)
  const analytics = {
    views: 1234,
    viewsTrend: { value: 12.5, isPositive: true },
    orders: 89,
    ordersTrend: { value: 8.3, isPositive: true },
    revenue: defaultVariant ? defaultVariant.selling_price * 89 : 0,
    revenueTrend: { value: 15.2, isPositive: true },
    conversion: 7.2,
    conversionTrend: { value: -2.1, isPositive: false },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">ID: #{product.id} · Slug: {product.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle active/inactive */}
          <button
            onClick={() => product && toggleMutation.mutate(product.status)}
            disabled={toggleMutation.isPending || product?.status === 'draft'}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              product?.status === 'active'
                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title={product?.status === 'active' ? 'Tắt sản phẩm' : 'Bật sản phẩm'}
          >
            {product?.status === 'active'
              ? <><ToggleRight size={16} className="text-green-600" /> Đang bật</>
              : <><ToggleLeft size={16} /> Đang tắt</>
            }
          </button>
          <Link
            href={`/dashboard/products/${product?.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Pencil size={14} /> Chỉnh sửa
          </Link>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Lượt xem" value={analytics.views.toLocaleString()} trend={analytics.viewsTrend} color="blue" />
        <StatCard icon={ShoppingCart} label="Đơn hàng" value={analytics.orders} trend={analytics.ordersTrend} color="green" />
        <StatCard icon={DollarSign} label="Doanh thu" value={`${analytics.revenue.toLocaleString()}₫`} trend={analytics.revenueTrend} color="indigo" />
        <StatCard icon={TrendingUp} label="Tỷ lệ chuyển đổi" value={`${analytics.conversion}%`} trend={analytics.conversionTrend} color="orange" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Thông tin sản phẩm</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {thumbnail ? (
                  <img src={thumbnail} alt={product.name} className="h-24 w-24 rounded-lg border border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                    <Package size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    {statusBadge(product.status)}
                  </div>
                  {product.short_description && (
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
                  )}
                  {/* Rating */}
                  {product.avg_rating > 0 && (
                    <div className="mt-1.5 flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} className={s <= Math.round(product.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                      <span className="ml-1 text-xs text-gray-500">{product.avg_rating.toFixed(1)} ({product.rating_count} đánh giá)</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {product.brand && (
                      <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
                        <Tag size={10} /> {product.brand.name}
                      </span>
                    )}
                    {product.category && (
                      <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
                        <Folder size={10} /> {product.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {product.description && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">Mô tả chi tiết</h4>
                  <p className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Biến thể ({variantCount})</h2>
              <span className="text-sm text-gray-500">Tổng tồn kho: <strong className="text-gray-900">{totalStock}</strong></span>
            </div>

            {variantCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-8 text-center">
                <Package size={32} className="mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Chưa có biến thể nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {product.variants?.map((variant, i) => (
                  <div key={variant.id ?? i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{variant.sku}</span>
                        {variant.is_default && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">Mặc định</span>
                        )}
                      </div>
                      {variant.attribute_values && Object.keys(variant.attribute_values).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(variant.attribute_values).map(([key, value]) => (
                            <span key={key} className="text-xs text-gray-500">
                              {key}: <strong>{String(value)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">{variant.selling_price.toLocaleString()}₫</p>
                        {variant.original_price > variant.selling_price && (
                          <p className="text-xs text-gray-400 line-through">{variant.original_price.toLocaleString()}₫</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${(variant.quantity ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variant.quantity ?? 0}
                        </p>
                        <p className="text-xs text-gray-400">Tồn kho</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images gallery */}
          {product.images && product.images.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Hình ảnh ({product.images.length})</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {product.images.map((img, i) => (
                  <div key={img.id ?? i} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                    <img src={img.url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                    {img.is_thumbnail && (
                      <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Bìa</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Health check */}
          <ProductHealthCheck product={product} />

          {/* Quick stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Thống kê nhanh</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Biến thể</span>
                <span className="font-semibold text-gray-900">{variantCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tồn kho</span>
                <span className={`font-semibold ${totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>{totalStock}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Hình ảnh</span>
                <span className="font-semibold text-gray-900">{product.images?.length ?? 0}</span>
              </div>
              {defaultVariant && (
                <>
                  <div className="border-t border-gray-100 pt-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Giá bán</span>
                    <span className="font-bold text-indigo-600">{defaultVariant.selling_price.toLocaleString()}₫</span>
                  </div>
                  {defaultVariant.original_price > defaultVariant.selling_price && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Giá gốc</span>
                      <span className="text-gray-400 line-through">{defaultVariant.original_price.toLocaleString()}₫</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Thông tin khác</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <Star size={12} className="mt-0.5 shrink-0 text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-500">Đánh giá</p>
                  <p className="mt-0.5 font-medium text-gray-900">
                    {product.avg_rating ? `${product.avg_rating.toFixed(1)}/5 (${product.rating_count} đánh giá)` : 'Chưa có đánh giá'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Thao tác</h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                <Pencil size={14} /> Chỉnh sửa sản phẩm
              </Link>
              <button className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
                <Activity size={14} /> Xem lịch sử thay đổi
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
                <BarChart3 size={14} /> Xem báo cáo chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
