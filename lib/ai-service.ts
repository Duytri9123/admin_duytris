import type { ProductInfo, RevenueData, RevenueAnalysis, PriceSuggestion } from '@/types'

// Admin AI service - calls Next.js API Routes (API keys stay server-side)
export const aiService = {
  // Tạo mô tả sản phẩm tự động (streaming)
  async generateProductDescription(
    productInfo: ProductInfo,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productInfo),
    })
    if (!response.ok) throw new Error(`AI generate-description failed: ${response.statusText}`)
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      fullText += chunk
      onChunk?.(chunk)
    }

    return fullText
  },

  // Phân tích doanh thu bằng AI
  async analyzeRevenue(data: RevenueData): Promise<RevenueAnalysis> {
    const res = await fetch('/api/ai/analyze-revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`AI analyze-revenue failed: ${res.statusText}`)
    return res.json()
  },

  // Gợi ý giá và danh mục
  async suggestPriceAndCategory(productInfo: ProductInfo): Promise<PriceSuggestion> {
    const res = await fetch('/api/ai/suggest-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productInfo),
    })
    if (!res.ok) throw new Error(`AI suggest-price failed: ${res.statusText}`)
    return res.json()
  },
}
