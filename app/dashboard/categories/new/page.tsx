import { CategoryForm } from '@/components/categories/category-form'

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tạo danh mục</h1>
      <CategoryForm />
    </div>
  )
}
