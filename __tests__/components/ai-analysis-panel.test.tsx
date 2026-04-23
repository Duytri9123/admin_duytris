import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIAnalysisPanel } from '@/components/analytics/ai-analysis-panel'
import { aiService } from '@/lib/ai-service'
import type { RevenueData, RevenueAnalysis } from '@/types'

jest.mock('@/lib/ai-service', () => ({
  aiService: {
    analyzeRevenue: jest.fn(),
  },
}))

const mockRevenueData: RevenueData = {
  period: 'month',
  orders: [],
  total_revenue: 5000000,
  order_count: 20,
}

const mockAnalysis: RevenueAnalysis = {
  summary: 'Doanh thu tháng này tăng 15%',
  trends: ['Xu hướng tăng trưởng tốt'],
  recommendations: ['Tăng cường marketing'],
  top_products: ['Sản phẩm A'],
}

describe('AIAnalysisPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial state with analyze button', () => {
    render(<AIAnalysisPanel revenueData={mockRevenueData} />)
    expect(screen.getByText(/Phân tích bằng AI/)).toBeInTheDocument()
    expect(screen.getByText(/Nhấn nút để nhận phân tích/)).toBeInTheDocument()
  })

  it('shows loading state while analyzing', async () => {
    let resolve!: (v: RevenueAnalysis) => void
    ;(aiService.analyzeRevenue as jest.Mock).mockReturnValue(
      new Promise<RevenueAnalysis>((r) => { resolve = r })
    )

    const user = userEvent.setup()
    render(<AIAnalysisPanel revenueData={mockRevenueData} />)

    await user.click(screen.getByText(/Phân tích bằng AI/))

    expect(screen.getByText('Đang phân tích...')).toBeInTheDocument()

    resolve(mockAnalysis)
    await waitFor(() => expect(screen.queryByText('Đang phân tích...')).not.toBeInTheDocument())
  })

  it('displays analysis results after successful call', async () => {
    ;(aiService.analyzeRevenue as jest.Mock).mockResolvedValue(mockAnalysis)

    const user = userEvent.setup()
    render(<AIAnalysisPanel revenueData={mockRevenueData} />)

    await user.click(screen.getByText(/Phân tích bằng AI/))

    await waitFor(() => {
      expect(screen.getByText('Doanh thu tháng này tăng 15%')).toBeInTheDocument()
      expect(screen.getByText('Xu hướng tăng trưởng tốt')).toBeInTheDocument()
      expect(screen.getByText('Tăng cường marketing')).toBeInTheDocument()
    })
  })

  it('displays error message on failure', async () => {
    ;(aiService.analyzeRevenue as jest.Mock).mockRejectedValue(new Error('API error'))

    const user = userEvent.setup()
    render(<AIAnalysisPanel revenueData={mockRevenueData} />)

    await user.click(screen.getByText(/Phân tích bằng AI/))

    await waitFor(() => {
      expect(screen.getByText('API error')).toBeInTheDocument()
    })
  })
})
