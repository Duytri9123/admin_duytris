import { ProductForm } from '@/components/products/product-form'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tạo sản phẩm</h1>
      <ProductForm />
    </div>
  )
}
