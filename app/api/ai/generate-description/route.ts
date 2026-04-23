import { NextRequest } from 'next/server'
import type { ProductInfo } from '@/types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function buildTemplate(info: ProductInfo): string {
  const brand = info.brand ? ` từ thương hiệu ${info.brand}` : ''
  const category = info.category ? ` thuộc danh mục ${info.category}` : ''
  return `${info.name}${brand}${category} là sản phẩm chất lượng cao, đáp ứng nhu cầu của khách hàng.\n\nSản phẩm được thiết kế tỉ mỉ với chất liệu cao cấp, mang lại trải nghiệm tốt nhất cho người dùng.\n\nHãy trải nghiệm sự khác biệt với ${info.name} — lựa chọn hoàn hảo cho cuộc sống hiện đại.`
}

export async function POST(req: NextRequest) {
  const productInfo: ProductInfo = await req.json()
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return new Response(buildTemplate(productInfo), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const prompt = `Viết mô tả sản phẩm hấp dẫn bằng tiếng Việt cho:
Tên: ${productInfo.name}
Thương hiệu: ${productInfo.brand ?? 'Không rõ'}
Danh mục: ${productInfo.category ?? 'Không rõ'}
Thuộc tính: ${JSON.stringify(productInfo.attributes ?? {})}

Yêu cầu: 2-3 đoạn, nêu bật tính năng, lợi ích, phù hợp SEO.`

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], stream: true }),
    })

    if (!response.ok || !response.body) {
      return new Response(buildTemplate(productInfo), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const text = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
                if (text) controller.enqueue(encoder.encode(text))
              } catch { /* skip malformed */ }
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch {
    return new Response(buildTemplate(productInfo), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}
