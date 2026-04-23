import { NextRequest, NextResponse } from 'next/server'
import type { RevenueData, RevenueAnalysis } from '@/types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function buildFallback(data: RevenueData): RevenueAnalysis {
  const avg = data.order_count > 0 ? Math.round(data.total_revenue / data.order_count) : 0
  return {
    summary: `Doanh thu ${data.total_revenue.toLocaleString('vi-VN')}đ từ ${data.order_count} đơn hàng.`,
    trends: [`Giá trị đơn trung bình: ${avg.toLocaleString('vi-VN')}đ`],
    recommendations: ['Tăng cường marketing', 'Tối ưu trải nghiệm mua sắm'],
    top_products: [],
  }
}

export async function POST(req: NextRequest) {
  const data: RevenueData = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json(buildFallback(data))

  try {
    const prompt = `Phân tích doanh thu: tổng ${data.total_revenue.toLocaleString('vi-VN')}đ, ${data.order_count} đơn. Trả về JSON: { "summary": "", "trends": [], "recommendations": [], "top_products": [] }`
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.4 }),
    })
    if (!response.ok) throw new Error()
    const result = await response.json()
    return NextResponse.json(JSON.parse(result.choices?.[0]?.message?.content ?? '{}'))
  } catch {
    return NextResponse.json(buildFallback(data))
  }
}
