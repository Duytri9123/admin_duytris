'use client'

import Link from 'next/link'
import { ProductTable } from '@/components/products/product-table'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
        <Link href="/dashboard/products/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Thêm sản phẩm
        </Link>
      </div>
      <ProductTable />
    </div>
  )
}
