import { ProductForm } from '@/components/products/product-form'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
      <ProductForm productId={Number(id)} />
    </div>
  )
}
