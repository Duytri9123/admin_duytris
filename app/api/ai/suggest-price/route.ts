import { NextRequest, NextResponse } from 'next/server'
import type { ProductInfo, PriceSuggestion } from '@/types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function buildFallback(info: ProductInfo): PriceSuggestion {
  const suggested = info.price_range ? Math.round((info.price_range.min + info.price_range.max) / 2) : 299000
  return { suggested_price: suggested, suggested_category_id: 0, reasoning: 'Gợi ý dựa trên khoảng giá tham khảo.', confidence: 0.3 }
}

export async function POST(req: NextRequest) {
  const productInfo: ProductInfo = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json(buildFallback(productInfo))

  try {
    const prompt = `Gợi ý giá bán (VND) cho sản phẩm: ${productInfo.name}, thương hiệu: ${productInfo.brand ?? 'N/A'}. Trả về JSON: { "suggested_price": số, "suggested_category_id": 0, "reasoning": "", "confidence": 0.8 }`
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.3 }),
    })
    if (!response.ok) throw new Error()
    const result = await response.json()
    return NextResponse.json(JSON.parse(result.choices?.[0]?.message?.content ?? '{}'))
  } catch {
    return NextResponse.json(buildFallback(productInfo))
  }
}
