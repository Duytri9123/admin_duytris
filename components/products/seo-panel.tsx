'use client'

import { useState, useEffect } from 'react'
import { generateMetaTitle, generateMetaDescription, generateKeywords } from '@/lib/seo'

interface SeoPanelProps {
  productName: string
  brandName?: string
  categoryName?: string
  description?: string
}

export function SeoPanel({ productName, brandName, categoryName, description }: SeoPanelProps) {
  const getAutoValues = () => ({
    title: generateMetaTitle(productName, brandName, categoryName),
    metaDescription: generateMetaDescription(description ?? ''),
    keywords: generateKeywords(productName, brandName, categoryName),
  })

  const [title, setTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])

  useEffect(() => {
    const auto = getAutoValues()
    setTitle(auto.title)
    setMetaDescription(auto.metaDescription)
    setKeywords(auto.keywords)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName, brandName, categoryName, description])

  const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">SEO</h2>
        <button type="button" onClick={() => { const a = getAutoValues(); setTitle(a.title); setMetaDescription(a.metaDescription); setKeywords(a.keywords) }} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
          Tạo lại
        </button>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Meta title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        <p className="mt-1 text-xs text-gray-400">{title.length} ký tự (khuyến nghị &lt; 60)</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Meta description</label>
        <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} className={inputClass} />
        <p className="mt-1 text-xs text-gray-400">{metaDescription.length} ký tự (khuyến nghị &lt; 160)</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Từ khóa</label>
        <input type="text" value={keywords.join(', ')} onChange={(e) => setKeywords(e.target.value.split(',').map((k) => k.trim()).filter(Boolean))} className={inputClass} placeholder="keyword1, keyword2, ..." />
        <p className="mt-1 text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
      </div>
    </div>
  )
}
