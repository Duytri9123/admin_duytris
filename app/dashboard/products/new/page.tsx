'use client'

import { ProductForm } from '@/components/products/product-form'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tạo sản phẩm mới</h1>
        <p className="mt-1 text-sm text-gray-500">Thêm một sản phẩm mới vào cửa hàng của bạn</p>
      </div>
      <ProductForm />
    </div>
  )
}
