'use client'

/**
 * useTableState — persist filter/page state vào URL search params
 *
 * Lợi ích:
 * - Khi chuyển sang tab khác rồi quay lại, URL vẫn còn → state được khôi phục
 * - queryKey giống nhau → React Query dùng cache, không fetch lại
 * - Có thể share link với filter đang chọn
 */

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Primitive = string | number | boolean | null | undefined

export function useTableState<T extends Record<string, Primitive>>(defaults: T) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Đọc giá trị từ URL, fallback về default
  const state = Object.fromEntries(
    Object.entries(defaults).map(([key, defaultVal]) => {
      const raw = searchParams.get(key)
      if (raw === null) return [key, defaultVal]

      // Coerce về đúng type dựa vào default value
      if (typeof defaultVal === 'number') return [key, Number(raw)]
      if (typeof defaultVal === 'boolean') return [key, raw === 'true']
      return [key, raw]
    })
  ) as T

  // Cập nhật một hoặc nhiều params, reset page về 1 nếu filter thay đổi
  const setState = useCallback(
    (updates: Partial<T> & { page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())

      // Nếu thay đổi filter (không phải page), reset page về 1
      const isFilterChange = Object.keys(updates).some((k) => k !== 'page')
      if (isFilterChange && !('page' in updates)) {
        params.set('page', '1')
      }

      for (const [key, val] of Object.entries(updates)) {
        const defaultVal = defaults[key as keyof T]
        // Xóa param nếu bằng default để URL gọn hơn
        if (val === defaultVal || val === null || val === undefined || val === '') {
          params.delete(key)
        } else {
          params.set(key, String(val))
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams, defaults]
  )

  return [state, setState] as const
}
