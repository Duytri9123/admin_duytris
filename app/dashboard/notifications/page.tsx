'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell, BellOff, Trash2, CheckCheck, Package, ShoppingCart,
  Users, Star, AlertCircle, Info, X, Plus, Send, Megaphone,
  Tag, ToggleLeft, ToggleRight, Globe, Clock, Eye, UserCheck, UserX,
} from 'lucide-react'
import api from '@/lib/api-client'
import type { PaginatedResponse } from '@/types'

interface Notification {
  id: number
  title: string
  message: string
  type: 'order' | 'product' | 'user' | 'review' | 'system' | 'info' | 'promo'
  is_read: boolean
  created_at: string
  link?: string
  target?: string
  recipients_count?: number
}

interface BroadcastNotification {
  id: number
  title: string
  message: string
  type: string
  link?: string
  is_active: boolean
  expires_at?: string
  created_at: string
}

const TYPE_MAP: Record<string, { icon: React.ElementType; bg: string; text: string; label: string; emoji: string }> = {
  order:   { icon: ShoppingCart, bg: 'bg-green-100',  text: 'text-green-600',  label: 'Đơn hàng',   emoji: '🛒' },
  product: { icon: Package,      bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'Sản phẩm',   emoji: '📦' },
  user:    { icon: Users,        bg: 'bg-indigo-100', text: 'text-indigo-600', label: 'Người dùng', emoji: '👤' },
  review:  { icon: Star,         bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Đánh giá',   emoji: '⭐' },
  system:  { icon: AlertCircle,  bg: 'bg-red-100',    text: 'text-red-600',    label: 'Hệ thống',   emoji: '🚨' },
  promo:   { icon: Tag,          bg: 'bg-purple-100', text: 'text-purple-600', label: 'Khuyến mãi', emoji: '🏷️' },
  info:    { icon: Info,         bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Thông tin',  emoji: 'ℹ️' },
}

const TARGET_LABEL: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  all:       { label: 'Tất cả',        color: 'bg-indigo-100 text-indigo-700', icon: Users },
  users:     { label: 'Người dùng',    color: 'bg-green-100 text-green-700',   icon: UserCheck },
  admins:    { label: 'Admin',         color: 'bg-orange-100 text-orange-700', icon: UserX },
  broadcast: { label: 'Broadcast',     color: 'bg-purple-100 text-purple-700', icon: Megaphone },
}

// ─── Type selector - dạng select với icon preview ────────────────────────────
function TypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = TYPE_MAP[value] ?? TYPE_MAP.info
  const SelIcon = selected.icon
  return (
    <div className="flex items-center gap-2">
      {/* Icon preview */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected.bg}`}>
        <SelIcon size={16} className={selected.text} />
      </div>
      {/* Select */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {Object.entries(TYPE_MAP).map(([type, { label, emoji }]) => (
          <option key={type} value={type}>{emoji} {label}</option>
        ))}
      </select>
    </div>
  )
}

// ??? Detail Modal ?????????????????????????????????????????????????????????????
function DetailModal({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  const t = TYPE_MAP[notif.type] ?? TYPE_MAP.info
  const Icon = t.icon
  const tgt = TARGET_LABEL[notif.target ?? 'admins'] ?? TARGET_LABEL.admins
  const TgtIcon = tgt.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={"flex h-8 w-8 items-center justify-center rounded-lg " + t.bg}>
              <Icon size={16} className={t.text} />
            </div>
            <h2 className="text-base font-bold text-gray-900">Chi tiết thông báo</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Tiêu đề</p>
            <p className="text-base font-semibold text-gray-900">{notif.title}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Nội dung</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notif.message}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Loại thông báo</p>
            <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " + t.bg + " " + t.text}>
              <Icon size={11} /> {t.emoji} {t.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Đối tượng nhận</p>
              <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " + tgt.color}>
                <TgtIcon size={11} /> {tgt.label}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Số người nhận</p>
              <p className="text-lg font-bold text-gray-900">
                {notif.recipients_count ?? 0}
                <span className="ml-1 text-xs font-normal text-gray-400">người</span>
              </p>
            </div>
          </div>
          {notif.link && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Link</p>
              <a href={notif.link} className="text-sm text-indigo-600 hover:underline break-all">{notif.link}</a>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Thời gian gửi</p>
            <p className="text-sm text-gray-700">{new Date(notif.created_at).toLocaleString('vi-VN')}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " + (notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700')}>
              {notif.is_read ? 'Đã đọc' : 'Chưa đọc'}
            </span>
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ??? Send Modal ???????????????????????????????????????????????????????????????
function SendModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'targeted' | 'broadcast'>('targeted')
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all', link: '' })
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'info', link: '', expires_at: '' })

  const { data: userStats } = useQuery({
    queryKey: ['user-stats-for-notif'],
    queryFn: () => api.get<any>('/api/admin/users', { per_page: 1 }).then(r => r.data),
  })

  const getTargetPreview = (target: string) => {
    const total = userStats?.total ?? 0
    if (target === 'all') return { count: total, label: 'người dùng' }
    if (target === 'users') return { count: Math.max(0, total - 1), label: 'người dùng thường' }
    if (target === 'admins') return { count: 1, label: 'admin' }
    return { count: 0, label: '' }
  }

  const sendMutation = useMutation({
    mutationFn: () => api.post('/api/admin/notifications/send', form),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      const count = res?.data?.recipients_count ?? 0
      alert('Đã gửi thành công đến ' + count + ' người dùng!')
      onClose()
    },
  })

  const broadcastMutation = useMutation({
    mutationFn: () => api.post('/api/admin/broadcast', broadcastForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcast'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      onClose()
    },
  })

  const selectedType = tab === 'targeted' ? form.type : broadcastForm.type

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Send size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Gửi thông báo</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex border-b border-gray-200 shrink-0">
          <button onClick={() => setTab('targeted')}
            className={"flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors " + (tab === 'targeted' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700')}>
            <Users size={14} /> Gửi có mục tiêu
          </button>
          <button onClick={() => setTab('broadcast')}
            className={"flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors " + (tab === 'broadcast' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700')}>
            <Megaphone size={14} /> Broadcast (tất cả)
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {tab === 'targeted' ? (
            <>
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                💡 Gửi đến người dùng đã đăng nhập. Hiển thị trong chuông thông báo cá nhân.
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Tiêu đề thông báo" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nội dung *</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nội dung thông báo..." />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Loại thông báo</label>
                <TypeSelector value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gửi đến</label>
                <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="all">Tất cả người dùng</option>
                  <option value="users">Chỉ người dùng thường</option>
                  <option value="admins">Chỉ admin</option>
                </select>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                <Users size={13} className="text-indigo-500" />
                Sẽ gửi đến <strong className="text-indigo-600 mx-1">{getTargetPreview(form.target).count}</strong> {getTargetPreview(form.target).label}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Link (tùy chọn)</label>
                <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="/products hoặc /orders/123" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
                <button onClick={() => sendMutation.mutate()}
                  disabled={!form.title.trim() || !form.message.trim() || sendMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  <Send size={14} /> {sendMutation.isPending ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-700">
                📢 Broadcast hiển thị cho <strong>tất cả mọi người</strong> kể cả chưa đăng nhập. Cập nhật realtime mỗi 15 giây.
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề *</label>
                <input value={broadcastForm.title} onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="VD: 🎉 Flash Sale 50% hôm nay!" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nội dung *</label>
                <textarea value={broadcastForm.message} onChange={e => setBroadcastForm(p => ({ ...p, message: e.target.value }))}
                  rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Nội dung chi tiết..." />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Loại thông báo</label>
                <TypeSelector value={broadcastForm.type} onChange={v => setBroadcastForm(p => ({ ...p, type: v }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hết hạn (tùy chọn)</label>
                <input type="datetime-local" value={broadcastForm.expires_at}
                  onChange={e => setBroadcastForm(p => ({ ...p, expires_at: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Link (tùy chọn)</label>
                <input value={broadcastForm.link} onChange={e => setBroadcastForm(p => ({ ...p, link: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="/products?sale=1" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
                <button onClick={() => broadcastMutation.mutate()}
                  disabled={!broadcastForm.title.trim() || !broadcastForm.message.trim() || broadcastMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
                  <Megaphone size={14} /> {broadcastMutation.isPending ? 'Đang gửi...' : 'Broadcast ngay'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ??? Main Page ????????????????????????????????????????????????????????????????
export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [activeTab, setActiveTab] = useState<'admin' | 'broadcast'>('admin')
  const [showSendModal, setShowSendModal] = useState(false)
  const [detailNotif, setDetailNotif] = useState<Notification | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page, filter],
    queryFn: () => api.get<PaginatedResponse<Notification>>('/api/admin/notifications', {
      page, per_page: 20, unread_only: filter === 'unread' ? 1 : undefined,
    }).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: broadcastData, isLoading: broadcastLoading } = useQuery({
    queryKey: ['admin-broadcast'],
    queryFn: () => api.get<PaginatedResponse<BroadcastNotification>>('/api/admin/broadcast', { per_page: 20 }).then(r => r.data),
    enabled: activeTab === 'broadcast',
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/api/admin/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  })
  const markRead = useMutation({
    mutationFn: (id: number) => api.post('/api/admin/notifications/' + id + '/read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  })
  const deleteNotif = useMutation({
    mutationFn: (id: number) => api.delete('/api/admin/notifications/' + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  })
  const toggleBroadcast = useMutation({
    mutationFn: (id: number) => api.patch('/api/admin/broadcast/' + id + '/toggle'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-broadcast'] }),
  })
  const deleteBroadcast = useMutation({
    mutationFn: (id: number) => api.delete('/api/admin/broadcast/' + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-broadcast'] }),
  })

  const notifications = data?.data ?? []
  const broadcasts = broadcastData?.data ?? []
  const lastPage = data?.last_page ?? 1
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý thông báo hệ thống và broadcast</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'admin' && unreadCount > 0 && (
            <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
              <CheckCheck size={14} /> Đọc tất cả
            </button>
          )}
          <button onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={14} /> Gửi thông báo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        <button onClick={() => setActiveTab('admin')}
          className={"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors " + (activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
          <Bell size={14} /> Hệ thống
          {unreadCount > 0 && (
            <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-bold " + (activeTab === 'admin' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600')}>{unreadCount}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('broadcast')}
          className={"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors " + (activeTab === 'broadcast' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
          <Globe size={14} /> Broadcast
          <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-bold " + (activeTab === 'broadcast' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600')}>Realtime</span>
        </button>
      </div>

      {/* Admin Notifications Tab */}
      {activeTab === 'admin' && (
        <>
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 w-fit">
            {(['all', 'unread'] as const).map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }}
                className={"rounded px-4 py-1.5 text-xs font-medium transition-colors " + (filter === f ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800')}>
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {isLoading ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            )) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
                <BellOff size={40} className="mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Không có thông báo nào</p>
              </div>
            ) : notifications.map(notif => {
              const t = TYPE_MAP[notif.type] ?? TYPE_MAP.info
              const Icon = t.icon
              const tgt = TARGET_LABEL[notif.target ?? 'admins'] ?? TARGET_LABEL.admins
              const TgtIcon = tgt.icon
              return (
                <div key={notif.id}
                  className={"flex items-start gap-3 rounded-xl border p-4 transition-colors cursor-pointer hover:shadow-sm " + (notif.is_read ? 'border-gray-200 bg-white' : 'border-indigo-200 bg-indigo-50')}
                  onClick={() => { setDetailNotif(notif); if (!notif.is_read) markRead.mutate(notif.id) }}>
                  <div className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + t.bg}>
                    <Icon size={16} className={t.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={"text-sm font-semibold " + (notif.is_read ? 'text-gray-700' : 'text-gray-900')}>{notif.title}</p>
                        <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " + t.bg + " " + t.text}>
                          <Icon size={9} /> {t.emoji} {t.label}
                        </span>
                        <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " + tgt.color}>
                          <TgtIcon size={9} /> {tgt.label}
                        </span>
                        {notif.recipients_count !== undefined && notif.recipients_count > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            <Users size={9} /> {notif.recipients_count} người
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {new Date(notif.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDetailNotif(notif)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Xem chi tiết">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => deleteNotif.mutate(notif.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="text-xs">Trang {page} / {lastPage}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">← Trước</button>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Sau →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Broadcast Tab */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start gap-3">
              <Megaphone size={20} className="mt-0.5 shrink-0 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-purple-900">Broadcast Realtime</p>
                <p className="mt-0.5 text-xs text-purple-700">
                  Thông báo broadcast hiển thị cho <strong>tất cả mọi người</strong> kể cả chưa đăng nhập.
                  Frontend tự động poll mỗi <strong>15 giây</strong> và hiện toast popup khi có thông báo mới.
                </p>
              </div>
            </div>
          </div>

          {broadcastLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          )) : broadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
              <Globe size={40} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Chưa có broadcast nào</p>
              <button onClick={() => setShowSendModal(true)}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                <Megaphone size={14} /> Tạo broadcast đầu tiên
              </button>
            </div>
          ) : broadcasts.map(b => {
            const t = TYPE_MAP[b.type] ?? TYPE_MAP.info
            const Icon = t.icon
            const isExpired = b.expires_at && new Date(b.expires_at) < new Date()
            return (
              <div key={b.id}
                className={"flex items-start gap-3 rounded-xl border p-4 " + (!b.is_active || isExpired ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-purple-200 bg-white')}>
                <div className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + t.bg}>
                  <Icon size={16} className={t.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                      <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " + t.bg + " " + t.text}>
                        <Icon size={9} /> {t.emoji} {t.label}
                      </span>
                      {b.is_active && !isExpired && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">LIVE</span>
                      )}
                      {isExpired && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">Hết hạn</span>
                      )}
                      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                        Tất cả người dùng
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {new Date(b.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{b.message}</p>
                  {b.expires_at && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} /> Hết hạn: {new Date(b.expires_at).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => toggleBroadcast.mutate(b.id)}
                    className={"rounded-lg p-1.5 transition-colors " + (b.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100')}
                    title={b.is_active ? 'Tắt' : 'Bật'}>
                    {b.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => deleteBroadcast.mutate(b.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Xóa">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showSendModal && <SendModal onClose={() => setShowSendModal(false)} />}
      {detailNotif && <DetailModal notif={detailNotif} onClose={() => setDetailNotif(null)} />}
    </div>
  )
}
