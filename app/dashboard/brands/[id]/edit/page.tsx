import { BrandForm } from '@/components/brands/brand-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBrandPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa thương hiệu</h1>
      <BrandForm brandId={Number(id)} />
    </div>
  )
}
