'use client'
import { useState } from 'react'
import Link from 'next/link'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Tooltip } from '@/components/ui/tooltip'

export function HeaderUserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <Tooltip content={user.name} side="bottom">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white uppercase">
            {user.name?.[0] ?? 'A'}
          </div>
          <span className="hidden max-w-[100px] truncate text-sm font-medium md:block">{user.name}</span>
          <ChevronDown size={14} className="hidden text-gray-400 md:block" />
        </button>
      </Tooltip>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-52 rounded-xl border border-gray-200 bg-white shadow-xl py-1">
            {/* User info */}
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={15} className="text-gray-400" />
              Cài đặt
            </Link>

            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={15} className="text-gray-400" />
              Hồ sơ
            </Link>

            <div className="border-t mt-1">
              <button
                onClick={() => { setOpen(false); logout() }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
