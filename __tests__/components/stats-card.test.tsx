import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatsCard } from '@/components/analytics/stats-card'

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Doanh thu" value="1,000,000₫" />)
    expect(screen.getByText('Doanh thu')).toBeInTheDocument()
    expect(screen.getByText('1,000,000₫')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    render(<StatsCard title="Đơn hàng" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders trend when provided', () => {
    render(<StatsCard title="Title" value="100" trend="+10% so với tháng trước" />)
    expect(screen.getByText('+10% so với tháng trước')).toBeInTheDocument()
  })

  it('does not render trend when not provided', () => {
    render(<StatsCard title="Title" value="100" />)
    // No trend paragraph should be present
    expect(screen.queryByText(/so với/)).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<StatsCard title="Title" value="100" icon={<span data-testid="icon">★</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
