import { CategoryForm } from '@/components/categories/category-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa danh mục</h1>
      <CategoryForm categoryId={Number(id)} />
    </div>
  )
}
