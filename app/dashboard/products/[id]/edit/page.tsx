'use client'

import { use } from 'react'
import { ProductForm } from '@/components/products/product-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params)
  const productId = Number(id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
        <p className="mt-1 text-sm text-gray-500">Cập nhật thông tin sản phẩm #{productId}</p>
      </div>
      <ProductForm productId={productId} />
    </div>
  )
}
