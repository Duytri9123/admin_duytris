'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface SidebarLogoProps {
  collapsed: boolean
  siteName?: string
  logoUrl?: string
  accentColor?: string
}

export function SidebarLogo({ collapsed, siteName = 'Admin Panel', logoUrl, accentColor = '#6366f1' }: SidebarLogoProps) {
  return (
    <Link
      href="/dashboard"
      className="flex h-14 items-center gap-3 border-b border-slate-700/60 px-4 shrink-0 overflow-hidden"
    >
      {logoUrl ? (
        <img src={logoUrl} alt={siteName} className="h-7 w-7 rounded object-contain shrink-0" />
      ) : (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accentColor }}
        >
          <Zap size={14} className="text-white" />
        </div>
      )}
      {!collapsed && (
        <span className="truncate text-sm font-bold text-slate-100 tracking-tight">
          {siteName}
        </span>
      )}
    </Link>
  )
}
