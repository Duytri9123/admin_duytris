'use client'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'
import { HeaderSearch, HeaderSearchDesktop } from './header-search'
import { HeaderNotifications } from './header-notifications'
import { HeaderUserMenu } from './header-user-menu'
import { Breadcrumb } from './breadcrumb'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/products':   'Sản phẩm',
  '/dashboard/categories': 'Danh mục',
  '/dashboard/brands':     'Thương hiệu',
  '/dashboard/orders':     'Đơn hàng',
  '/dashboard/users':      'Người dùng',
  '/dashboard/analytics':  'Thống kê',
  '/dashboard/settings':   'Cài đặt',
}

export function AdminHeader() {
  const pathname = usePathname()
  const { openMobile } = useSidebarStore()
  const title = PAGE_TITLES[pathname] ?? 'Admin'

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
      {/* Mobile hamburger */}
      <button
        onClick={openMobile}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Page title — desktop */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* Page title — mobile */}
      <h1 className="text-sm font-semibold text-gray-800 md:hidden">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1">
        <HeaderSearch />
        <HeaderSearchDesktop />
        <HeaderNotifications />
        <HeaderUserMenu />
      </div>
    </header>
  )
}
