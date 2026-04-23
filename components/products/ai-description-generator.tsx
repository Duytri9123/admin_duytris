'use client'

import { useState } from 'react'
import { aiService } from '@/lib/ai-service'
import type { ProductInfo } from '@/types'

interface AIDescriptionGeneratorProps {
  productInfo: ProductInfo
  onGenerated: (description: string) => void
}

export function AIDescriptionGenerator({ productInfo, onGenerated }: AIDescriptionGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setGenerated('')
    try {
      await aiService.generateProductDescription(productInfo, (chunk) => {
        setGenerated((prev) => prev + chunk)
      })
    } catch (err) {
      setError((err as Error).message ?? 'Không thể tạo mô tả')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-blue-100 bg-blue-50 p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !productInfo.name}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang tạo...' : '✨ Tạo mô tả bằng AI'}
        </button>
        {!productInfo.name && <span className="text-xs text-gray-500">Nhập tên sản phẩm trước</span>}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {(generated || loading) && (
        <div className="space-y-2">
          <textarea
            value={generated}
            onChange={(e) => setGenerated(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={loading ? 'Đang tạo mô tả...' : ''}
          />
          {!loading && generated && (
            <button
              type="button"
              onClick={() => onGenerated(generated)}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              Sử dụng mô tả này
            </button>
          )}
        </div>
      )}
    </div>
  )
}
