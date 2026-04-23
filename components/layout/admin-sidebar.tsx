'use client'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Tag, Bookmark, ShoppingCart, Users, BarChart2, Settings, ChevronLeft, ChevronRight, X, Bot } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useAdminSettings } from '@/lib/admin-settings-context'
import { SidebarLogo } from './sidebar-logo'
import { SidebarNavItem } from './sidebar-nav-item'
import { useAuth } from '@/hooks/use-auth'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/products',   label: 'Sản phẩm',    icon: Package },
  { href: '/dashboard/categories', label: 'Danh mục',    icon: Tag },
  { href: '/dashboard/brands',     label: 'Thương hiệu', icon: Bookmark },
  { href: '/dashboard/orders',     label: 'Đơn hàng',    icon: ShoppingCart },
  { href: '/dashboard/users',      label: 'Người dùng',  icon: Users },
  { href: '/dashboard/analytics',  label: 'Thống kê',    icon: BarChart2 },
  { href: '/dashboard/ai',         label: 'AI',          icon: Bot },
  { href: '/dashboard/settings',   label: 'Cài đặt',     icon: Settings },
]

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SIDEBAR_THEMES = {
  dark:  { bg: 'bg-slate-900', border: 'border-slate-700/60', text: 'text-slate-400', hover: 'hover:bg-slate-800 hover:text-slate-100', userText: 'text-slate-200', userSub: 'text-slate-500', toggleBg: 'bg-slate-900 border-slate-700', toggleText: 'text-slate-400 hover:text-white' },
  light: { bg: 'bg-white',     border: 'border-gray-200',     text: 'text-gray-500',  hover: 'hover:bg-gray-100 hover:text-gray-800',   userText: 'text-gray-800',   userSub: 'text-gray-400',  toggleBg: 'bg-white border-gray-300',     toggleText: 'text-gray-400 hover:text-gray-700' },
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { settings } = useAdminSettings()
  const theme = SIDEBAR_THEMES[settings.admin_sidebar_theme as 'dark' | 'light'] ?? SIDEBAR_THEMES.dark
  const accent = settings.admin_accent_color || '#6366f1'
  const logoUrl = settings.admin_logo_url || settings.logo_url
  const siteName = settings.admin_site_name || settings.site_name || 'Admin Panel'
  const fullLogoUrl = logoUrl ? `${API}${logoUrl}` : ''

  return (
    <div className={`flex h-full flex-col ${theme.bg}`}>
      <SidebarLogo collapsed={collapsed} siteName={siteName} logoUrl={fullLogoUrl} accentColor={accent} />
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <SidebarNavItem key={href} href={href} label={label} icon={icon}
              isActive={isActive} collapsed={collapsed} accentColor={accent}
              theme={settings.admin_sidebar_theme as 'dark' | 'light'} />
          )
        })}
      </nav>
      {user && (
        <div className={`border-t ${theme.border} p-3`}>
          <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ backgroundColor: accent }}>
              {user.name?.[0] ?? 'A'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className={`truncate text-xs font-medium ${theme.userText}`}>{user.name}</p>
                <p className={`truncate text-[11px] ${theme.userSub}`}>{user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminSidebar() {
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebarStore()
  const { settings } = useAdminSettings()
  const theme = SIDEBAR_THEMES[settings.admin_sidebar_theme as 'dark' | 'light'] ?? SIDEBAR_THEMES.dark

  return (
    <>
      <aside className={`relative hidden md:flex flex-col transition-all duration-300 ease-in-out shrink-0 ${collapsed ? 'w-16' : 'w-60'}`} style={{ minHeight: '100vh' }}>
        <SidebarContent collapsed={collapsed} />
        <button onClick={toggle}
          className={`absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-colors ${theme.toggleBg} ${theme.toggleText}`}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobile} />
          <aside className="absolute left-0 top-0 h-full w-60 shadow-2xl">
            <SidebarContent collapsed={false} />
            <button onClick={closeMobile} className={`absolute right-3 top-3 rounded-lg p-1.5 ${theme.text} ${theme.hover}`}>
              <X size={18} />
            </button>
          </aside>
        </div>
      )}
    </>
  )
}
