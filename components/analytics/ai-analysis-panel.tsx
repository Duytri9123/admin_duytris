'use client'

import { useState } from 'react'
import { aiService } from '@/lib/ai-service'
import type { RevenueData, RevenueAnalysis } from '@/types'

interface Props {
  revenueData: RevenueData
}

export function AIAnalysisPanel({ revenueData }: Props) {
  const [analysis, setAnalysis] = useState<RevenueAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await aiService.analyzeRevenue(revenueData)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể phân tích dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Phân tích AI</h2>
        <button onClick={handleAnalyze} disabled={loading} className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Đang phân tích...' : '✨ Phân tích bằng AI'}
        </button>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading && <p className="mt-3 text-sm text-gray-500">AI đang phân tích dữ liệu doanh thu...</p>}

      {analysis && !loading && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-700">{analysis.summary}</p>
          {analysis.trends.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-gray-900">Xu hướng</h3>
              <ul className="space-y-1">
                {analysis.trends.map((t, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-indigo-500">→</span>{t}</li>)}
              </ul>
            </div>
          )}
          {analysis.recommendations.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-gray-900">Đề xuất</h3>
              <ul className="space-y-1">
                {analysis.recommendations.map((r, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && !error && (
        <p className="mt-3 text-sm text-gray-400">Nhấn nút để nhận phân tích từ AI dựa trên dữ liệu doanh thu hiện tại.</p>
      )}
    </div>
  )
}
