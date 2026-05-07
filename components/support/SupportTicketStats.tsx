'use client'

import { useEffect, useState } from 'react'
import { supportTicketAdminApi } from '@/lib/api-client'

interface Stats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  by_category: {
    complaint: number
    support: number
    report: number
    feedback: number
  }
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
}

export function SupportTicketStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await supportTicketAdminApi.getStats()
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) return <div>Đang tải...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border">
        <p className="text-gray-500 text-sm">Tổng cộng</p>
        <p className="text-3xl font-bold">{stats.total}</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-blue-600 text-sm">Mở</p>
        <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-yellow-600 text-sm">Đang xử lý</p>
        <p className="text-3xl font-bold text-yellow-600">{stats.in_progress}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-green-600 text-sm">Đã giải quyết</p>
        <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-sm">Đã đóng</p>
        <p className="text-3xl font-bold text-gray-600">{stats.closed}</p>
      </div>
    </div>
  )
}
