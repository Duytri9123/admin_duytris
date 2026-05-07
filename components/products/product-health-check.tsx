'use client'

import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import type { Product } from '@/types'

interface HealthCheckResult {
  score: number // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor'
  issues: Array<{
    severity: 'critical' | 'warning' | 'info'
    title: string
    description: string
    suggestion?: string
  }>
}

/**
 * Perform comprehensive health check on product
 */
export function checkProductHealth(product: Product): HealthCheckResult {
  const issues: HealthCheckResult['issues'] = []
  let score = 100

  // ─── Basic info checks ───
  if (!product.name?.trim()) {
    issues.push({
      severity: 'critical',
      title: 'Tên sản phẩm trống',
      description: 'Sản phẩm phải có tên',
      suggestion: 'Thêm tên sản phẩm có ý nghĩa',
    })
    score -= 20
  } else if (product.name.length < 5) {
    issues.push({
      severity: 'warning',
      title: 'Tên sản phẩm quá ngắn',
      description: 'Tên sản phẩm nên có ít nhất 5 ký tự',
      suggestion: 'Mở rộng tên sản phẩm để mô tả rõ hơn',
    })
    score -= 5
  }

  // ─── Description checks ───
  if (!product.description?.trim()) {
    issues.push({
      severity: 'critical',
      title: 'Mô tả chi tiết trống',
      description: 'Mô tả chi tiết rất quan trọng cho SEO và chuyển đổi',
      suggestion: 'Viết mô tả chi tiết về sản phẩm (tối thiểu 50 ký tự)',
    })
    score -= 15
  } else if (product.description.length < 50) {
    issues.push({
      severity: 'warning',
      title: 'Mô tả chi tiết quá ngắn',
      description: 'Mô tả nên có ít nhất 50 ký tự',
      suggestion: 'Mở rộng mô tả để cung cấp thông tin chi tiết hơn',
    })
    score -= 10
  }

  if (!product.short_description?.trim()) {
    issues.push({
      severity: 'info',
      title: 'Mô tả ngắn trống',
      description: 'Mô tả ngắn giúp khách hàng nhanh chóng hiểu sản phẩm',
      suggestion: 'Thêm mô tả ngắn (1-2 dòng)',
    })
    score -= 5
  }

  // ─── Category checks ───
  if (!product.category_id) {
    issues.push({
      severity: 'critical',
      title: 'Chưa chọn danh mục',
      description: 'Danh mục giúp khách hàng tìm kiếm sản phẩm',
      suggestion: 'Chọn danh mục phù hợp cho sản phẩm',
    })
    score -= 15
  }

  // ─── Image checks ───
  const imageCount = product.images?.length ?? 0
  if (imageCount === 0) {
    issues.push({
      severity: 'critical',
      title: 'Không có hình ảnh',
      description: 'Hình ảnh là yếu tố quan trọng nhất ảnh hưởng đến tỷ lệ chuyển đổi',
      suggestion: 'Thêm ít nhất 1 hình ảnh chất lượng cao',
    })
    score -= 20
  } else if (imageCount < 3) {
    issues.push({
      severity: 'warning',
      title: 'Số lượng hình ảnh ít',
      description: 'Nên có ít nhất 3 hình ảnh để khách hàng xem từ nhiều góc độ',
      suggestion: 'Thêm 2-3 hình ảnh nữa',
    })
    score -= 8
  }

  const hasThumbnail = product.images?.some((img) => img.is_thumbnail)
  if (imageCount > 0 && !hasThumbnail) {
    issues.push({
      severity: 'warning',
      title: 'Chưa đặt ảnh bìa',
      description: 'Ảnh bìa là ảnh đầu tiên khách hàng nhìn thấy',
      suggestion: 'Chọn ảnh chất lượng nhất làm ảnh bìa',
    })
    score -= 5
  }

  // ─── Variant checks ───
  const variantCount = product.variants?.length ?? 0
  if (variantCount === 0) {
    issues.push({
      severity: 'critical',
      title: 'Không có biến thể',
      description: 'Sản phẩm phải có ít nhất 1 biến thể (kích cỡ, màu sắc, v.v.)',
      suggestion: 'Thêm ít nhất 1 biến thể với giá và tồn kho',
    })
    score -= 20
  }

  // ─── Stock checks ───
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantity ?? 0), 0) ?? 0
  if (totalStock === 0) {
    issues.push({
      severity: 'critical',
      title: 'Tồn kho bằng 0',
      description: 'Sản phẩm sẽ không hiển thị cho khách hàng',
      suggestion: 'Cập nhật tồn kho cho các biến thể',
    })
    score -= 20
  } else if (totalStock < 5) {
    issues.push({
      severity: 'warning',
      title: 'Tồn kho sắp hết',
      description: 'Tồn kho thấp có thể ảnh hưởng đến doanh số',
      suggestion: 'Cân nhắc nhập thêm hàng',
    })
    score -= 5
  }

  // ─── Price checks ───
  const defaultVariant = product.variants?.find((v) => v.is_default) ?? product.variants?.[0]
  if (!defaultVariant) {
    issues.push({
      severity: 'critical',
      title: 'Không có giá bán',
      description: 'Sản phẩm phải có giá bán',
      suggestion: 'Thêm giá bán cho biến thể mặc định',
    })
    score -= 15
  } else {
    if (defaultVariant.selling_price <= 0) {
      issues.push({
        severity: 'critical',
        title: 'Giá bán không hợp lệ',
        description: 'Giá bán phải lớn hơn 0',
        suggestion: 'Cập nhật giá bán',
      })
      score -= 15
    }

    if (defaultVariant.original_price && defaultVariant.original_price < defaultVariant.selling_price) {
      issues.push({
        severity: 'warning',
        title: 'Giá gốc nhỏ hơn giá bán',
        description: 'Giá gốc nên lớn hơn hoặc bằng giá bán',
        suggestion: 'Điều chỉnh giá gốc',
      })
      score -= 5
    }
  }

  // ─── Brand checks ───
  if (!product.brand_id) {
    issues.push({
      severity: 'info',
      title: 'Chưa chọn thương hiệu',
      description: 'Thương hiệu giúp khách hàng nhận diện sản phẩm',
      suggestion: 'Chọn hoặc tạo thương hiệu cho sản phẩm',
    })
    score -= 3
  }

  // ─── Status checks ───
  if (product.status === 'draft') {
    issues.push({
      severity: 'warning',
      title: 'Sản phẩm ở trạng thái nháp',
      description: 'Sản phẩm nháp không hiển thị cho khách hàng',
      suggestion: 'Chuyển sang trạng thái "Hoạt động" khi sẵn sàng',
    })
    score -= 10
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score))

  // Determine status
  let status: HealthCheckResult['status']
  if (score >= 80) status = 'excellent'
  else if (score >= 60) status = 'good'
  else if (score >= 40) status = 'fair'
  else status = 'poor'

  return { score, status, issues }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface ProductHealthCheckProps {
  product: Product
  compact?: boolean
}

export function ProductHealthCheck({ product, compact = false }: ProductHealthCheckProps) {
  const health = checkProductHealth(product)

  const statusConfig = {
    excellent: { color: 'text-green-600', bg: 'bg-green-50', label: 'Xuất sắc' },
    good: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Tốt' },
    fair: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Trung bình' },
    poor: { color: 'text-red-600', bg: 'bg-red-50', label: 'Kém' },
  }

  const config = statusConfig[health.status]

  if (compact) {
    return (
      <div className={`rounded-lg ${config.bg} px-3 py-2`}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
            <span className={`text-xs font-bold ${config.color}`}>{health.score}</span>
          </div>
          <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Kiểm tra sức khỏe sản phẩm</h3>
        <div className={`rounded-lg ${config.bg} px-3 py-1.5`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <span className={`text-sm font-bold ${config.color}`}>{health.score}</span>
            </div>
            <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all ${
            health.status === 'excellent'
              ? 'bg-green-500'
              : health.status === 'good'
                ? 'bg-blue-500'
                : health.status === 'fair'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
          }`}
          style={{ width: `${health.score}%` }}
        />
      </div>

      {/* Issues */}
      {health.issues.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle size={16} />
          Sản phẩm không có vấn đề nào
        </div>
      ) : (
        <div className="space-y-2">
          {health.issues.map((issue, i) => {
            const iconColor =
              issue.severity === 'critical'
                ? 'text-red-500'
                : issue.severity === 'warning'
                  ? 'text-yellow-500'
                  : 'text-blue-500'

            const Icon = issue.severity === 'critical' ? AlertCircle : issue.severity === 'warning' ? AlertTriangle : TrendingUp

            return (
              <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex gap-2">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{issue.title}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{issue.description}</p>
                    {issue.suggestion && (
                      <p className="mt-1 text-xs font-medium text-indigo-600">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
