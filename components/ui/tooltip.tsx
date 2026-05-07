'use client'
import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function Tooltip({ content, children, side = 'right' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [actualSide, setActualSide] = useState(side)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  // Tính toán lại vị trí khi tooltip hiện ra để tránh tràn viewport
  useEffect(() => {
    if (!visible || !wrapRef.current || !tipRef.current) return

    const wrap = wrapRef.current.getBoundingClientRect()
    const tip  = tipRef.current.getBoundingClientRect()
    const vw   = window.innerWidth
    const vh   = window.innerHeight
    const MARGIN = 8

    let best = side

    if (side === 'right' && wrap.right + tip.width + MARGIN > vw) {
      best = 'left'
    } else if (side === 'left' && wrap.left - tip.width - MARGIN < 0) {
      best = 'right'
    } else if (side === 'top' && wrap.top - tip.height - MARGIN < 0) {
      best = 'bottom'
    } else if (side === 'bottom' && wrap.bottom + tip.height + MARGIN > vh) {
      best = 'top'
    }

    setActualSide(best)
  }, [visible, side])

  const positions: Record<string, string> = {
    right:  'left-full ml-2 top-1/2 -translate-y-1/2',
    left:   'right-full mr-2 top-1/2 -translate-y-1/2',
    top:    'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  }

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => { setActualSide(side); setVisible(true) }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          ref={tipRef}
          className={`pointer-events-none absolute z-[9999] whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ${positions[actualSide]}`}
        >
          {content}
          {/* Arrow */}
          {actualSide === 'right'  && <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />}
          {actualSide === 'left'   && <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />}
          {actualSide === 'top'    && <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />}
          {actualSide === 'bottom' && <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />}
        </div>
      )}
    </div>
  )
}
