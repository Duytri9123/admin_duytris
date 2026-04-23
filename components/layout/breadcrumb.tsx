'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Sản phẩm',
  categories: 'Danh mục',
  brands: 'Thương hiệu',
  orders: 'Đơn hàng',
  users: 'Người dùng',
  analytics: 'Thống kê',
  settings: 'Cài đặt',
  new: 'Tạo mới',
  edit: 'Chỉnh sửa',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = segmentLabels[seg] ?? seg
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  if (crumbs.length <= 1) return null

  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500">
      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          {isLast ? (
            <span className="font-medium text-gray-800">{label}</span>
          ) : (
            <>
              <Link href={href} className="transition-colors hover:text-indigo-600">{label}</Link>
              <ChevronRight size={14} />
            </>
          )}
        </span>
      ))}
    </nav>
  )
}
