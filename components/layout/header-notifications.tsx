'use client'
import { useState } from 'react'
import { Bell, X, Package, ShoppingCart, Users } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

const MOCK_NOTIFICATIONS = [
  { id: 1, icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50', title: 'Đơn hàng mới #1042', time: '2 phút trước', read: false },
  { id: 2, icon: Package,      color: 'text-amber-600 bg-amber-50',   title: 'Sản phẩm sắp hết hàng', time: '15 phút trước', read: false },
  { id: 3, icon: Users,        color: 'text-emerald-600 bg-emerald-50', title: 'Người dùng mới đăng ký', time: '1 giờ trước', read: true },
]

export function HeaderNotifications() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unread = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })))

  return (
    <div className="relative">
      <Tooltip content="Thông báo" side="bottom">
        <button
          onClick={() => setOpen(o => !o)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                    Đánh dấu đã đọc
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.map(({ id, icon: Icon, color, title, time, read }) => (
                <div
                  key={id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!read ? 'bg-indigo-50/40' : ''}`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${read ? 'text-gray-600' : 'font-medium text-gray-900'}`}>{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                  </div>
                  {!read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-2.5 text-center">
              <button className="text-xs text-indigo-600 hover:underline">Xem tất cả thông báo</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
