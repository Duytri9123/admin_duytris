'use client'
import Link from 'next/link'
import { Tooltip } from '@/components/ui/tooltip'
import type { LucideIcon } from 'lucide-react'

interface SidebarNavItemProps {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
  collapsed: boolean
  accentColor?: string
  theme?: 'dark' | 'light'
  badge?: number
}

export function SidebarNavItem({
  href, label, icon: Icon, isActive, collapsed,
  accentColor = '#6366f1', theme = 'dark', badge,
}: SidebarNavItemProps) {
  const inactiveClass = theme === 'light'
    ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'

  const item = (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        isActive ? 'text-white shadow-sm' : inactiveClass
      } ${collapsed ? 'justify-center px-2' : ''}`}
      style={isActive ? { backgroundColor: accentColor } : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span
          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return <Tooltip content={label} side="right">{item}</Tooltip>
  }
  return item
}
