'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Package, ShoppingCart, Users, Star, AlertCircle, Info, CheckCheck, ExternalLink } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import Link from 'next/link'
import api from '@/lib/api-client'

interface Notification {
  id: number
  title: string
  message: string
  type: 'order' | 'product' | 'user' | 'review' | 'system' | 'info'
  is_read: boolean
  link?: string
  created_at: string
}

const TYPE_MAP: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  order:   { icon: ShoppingCart, bg: 'bg-green-100',  text: 'text-green-600'  },
  product: { icon: Package,      bg: 'bg-blue-100',   text: 'text-blue-600'   },
  user:    { icon: Users,        bg: 'bg-indigo-100', text: 'text-indigo-600' },
  review:  { icon: Star,         bg: 'bg-yellow-100', text: 'text-yellow-600' },
  system:  { icon: AlertCircle,  bg: 'bg-red-100',    text: 'text-red-600'    },
  info:    { icon: Info,         bg: 'bg-gray-100',   text: 'text-gray-600'   },
}

function fmtTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return d.toLocaleDateString('vi-VN')
}

export function HeaderNotifications() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const unread = notifications.filter(n => !n.is_read).length

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get<any>('/api/admin/notifications', { per_page: 20 })
      setNotifications(data.data ?? [])
    } catch {
      // silently fail
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Initial load + polling every 30s
  useEffect(() => {
    load()
    pollRef.current = setInterval(() => load(true), 30_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [load])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id: number) => {
    try {
      await api.post(`/api/admin/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/admin/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { /* ignore */ }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Tooltip content="Thông báo" side="bottom">
        <button
          onClick={() => { setOpen(o => !o); if (!open) load() }}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
                {unread > 0 && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    {unread} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <CheckCheck size={12} /> Đọc tất cả
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400">Không có thông báo nào</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon: Icon, bg, text } = TYPE_MAP[n.type] ?? TYPE_MAP.info
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markRead(n.id)}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
                        <Icon size={14} className={text} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{fmtTime(n.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-300 hover:text-indigo-500"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-2.5 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
