import React from 'react'
import { render, screen } from '@testing-library/react'
import { RevenueChart } from '@/components/analytics/revenue-chart'

// Mock recharts to avoid canvas/SVG issues in jsdom
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}))

describe('RevenueChart', () => {
  it('renders empty state when data is empty', () => {
    render(<RevenueChart data={[]} />)
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument()
  })

  it('renders chart when data is provided', () => {
    const data = [
      { date: '2024-01', revenue: 1000000 },
      { date: '2024-02', revenue: 2000000 },
    ]
    render(<RevenueChart data={data} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
