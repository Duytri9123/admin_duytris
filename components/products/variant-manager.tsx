'use client'

import type { ProductVariant } from '@/types'

interface VariantManagerProps {
  variants: Partial<ProductVariant>[]
  onChange: (variants: Partial<ProductVariant>[]) => void
}

const emptyVariant = (): Partial<ProductVariant> => ({
  sku: '',
  selling_price: 0,
  original_price: 0,
  quantity: 0,
  is_default: false,
})

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const addVariant = () => onChange([...variants, emptyVariant()])
  const removeVariant = (index: number) => onChange(variants.filter((_, i) => i !== index))
  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Biến thể sản phẩm</h3>
        <button type="button" onClick={addVariant} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          + Thêm biến thể
        </button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm italic text-gray-400">Chưa có biến thể nào.</p>
      )}

      {variants.map((variant, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Biến thể #{index + 1}</span>
            <button type="button" onClick={() => removeVariant(index)} className="text-xs text-red-500 hover:text-red-700">Xóa</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'sku', label: 'SKU', type: 'text', placeholder: 'SKU-001' },
              { key: 'selling_price', label: 'Giá bán', type: 'number' },
              { key: 'original_price', label: 'Giá gốc', type: 'number' },
              { key: 'quantity', label: 'Số lượng', type: 'number' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                <input
                  type={type}
                  min={type === 'number' ? 0 : undefined}
                  value={(variant[key as keyof ProductVariant] as string | number) ?? ''}
                  onChange={(e) => updateVariant(index, key as keyof ProductVariant, type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={variant.is_default ?? false}
              onChange={(e) => updateVariant(index, 'is_default', e.target.checked)}
              className="rounded border-gray-300"
            />
            Biến thể mặc định
          </label>
        </div>
      ))}
    </div>
  )
}
