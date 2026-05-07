import Link from 'next/link'
import { BrandTable } from '@/components/brands/brand-table'

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thương hiệu</h1>
        <Link href="/dashboard/brands/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          + Thêm thương hiệu
        </Link>
      </div>
      <BrandTable />
    </div>
  )
}
