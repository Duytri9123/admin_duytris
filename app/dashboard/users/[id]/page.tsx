'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Mail, Calendar, Shield, ShieldOff, CheckCircle,
  XCircle, Package, ShoppingCart, Star, AlertCircle, Key, Ban, Trash2, UserX,
  CreditCard, MapPin, Activity, MessageSquare, User, Settings
} from 'lucide-react'
import api from '@/lib/api-client'
import type { User, ApiResponse } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = use(params)
  const userId = Number(id)
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [banReason, setBanReason] = useState('')

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => api.get<ApiResponse<User>>(`/api/admin/users/${userId}`).then((r) => r.data.data),
  })

  const toggleAdminMutation = useMutation({
    mutationFn: (isAdmin: boolean) =>
      api.patch(`/api/admin/users/${userId}`, { is_admin: isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const banMutation = useMutation({
    mutationFn: (banned: boolean) =>
      api.patch(`/api/admin/users/${userId}`, { banned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (password: string) =>
      api.put(`/api/admin/users/${userId}/password`, { password, password_confirmation: password }),
    onSuccess: () => {
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
      alert('Đổi mật khẩu thành công!')
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Đổi mật khẩu thất bại')
    }
  })

  const banUserMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/api/admin/users/${userId}/ban`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowBanModal(false)
      setBanReason('')
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Vô hiệu hóa thất bại')
    }
  })

  const unbanUserMutation = useMutation({
    mutationFn: () => api.post(`/api/admin/users/${userId}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: () => api.delete(`/api/admin/users/${userId}`),
    onSuccess: () => {
      router.push('/dashboard/users')
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Xóa người dùng thất bại')
      setShowDeleteModal(false)
    }
  })

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user!} />
      case 'orders':
        return <OrdersTab userId={userId} />
      case 'reviews':
        return <ReviewsTab userId={userId} />
      case 'addresses':
        return <AddressesTab userId={userId} />
      case 'banks':
        return <BanksTab userId={userId} />
      case 'activity':
        return <ActivityTab userId={userId} />
      case 'settings':
        return <SettingsTab user={user!} onPasswordChange={() => setShowPasswordModal(true)} onBan={() => setShowBanModal(true)} onDelete={() => setShowDeleteModal(true)} onUnban={() => unbanUserMutation.mutate()} />
      default:
        return <OverviewTab user={user!} />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 text-center">
        <AlertCircle size={40} className="mb-3 text-red-400" />
        <p className="text-sm font-medium text-red-600">Không thể tải thông tin người dùng</p>
        <button onClick={() => router.back()} className="mt-3 text-xs text-red-500 hover:underline">← Quay lại</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết người dùng</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAdminMutation.mutate(!user.isAdmin)}
            disabled={toggleAdminMutation.isPending}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              user.isAdmin
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {user.isAdmin ? <><ShieldOff size={14} /> Bỏ admin</> : <><Shield size={14} /> Đặt admin</>}
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-600">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              {user.isAdmin && (
                <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  <Shield size={11} /> Admin
                </span>
              )}
              {user.email_verified_at ? (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <CheckCircle size={11} /> Đã xác thực
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                  <XCircle size={11} /> Chưa xác thực
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span>Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {[
            { key: 'overview', label: 'Tổng quan', icon: User },
            { key: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
            { key: 'reviews', label: 'Đánh giá', icon: Star },
            { key: 'addresses', label: 'Địa chỉ', icon: MapPin },
            { key: 'banks', label: 'Ngân hàng', icon: CreditCard },
            { key: 'activity', label: 'Hoạt động', icon: Activity },
            { key: 'settings', label: 'Cài đặt', icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {renderTabContent()}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (newPassword.length < 8) {
                    alert('Mật khẩu phải có ít nhất 8 ký tự')
                    return
                  }
                  if (newPassword !== confirmPassword) {
                    alert('Mật khẩu xác nhận không khớp')
                    return
                  }
                  changePasswordMutation.mutate(newPassword)
                }}
                disabled={changePasswordMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Vô hiệu hóa tài khoản</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Lý do</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nhập lý do vô hiệu hóa..."
                rows={3}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setBanReason('')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!banReason.trim()) {
                    alert('Vui lòng nhập lý do')
                    return
                  }
                  banUserMutation.mutate(banReason)
                }}
                disabled={banUserMutation.isPending}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {banUserMutation.isPending ? 'Đang xử lý...' : 'Vô hiệu hóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Xóa tài khoản</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{user.name}</strong>? 
              Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteUserMutation.mutate()}
                disabled={deleteUserMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS (Skeleton - To be implemented)
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tổng quan</h3>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: ShoppingCart, label: 'Đơn hàng', value: (user as any).orders_count ?? 0, color: 'bg-blue-100 text-blue-600' },
          { icon: Package, label: 'Sản phẩm', value: (user as any).products_count ?? 0, color: 'bg-green-100 text-green-600' },
          { icon: Star, label: 'Đánh giá', value: (user as any).reviews_count ?? 0, color: 'bg-yellow-100 text-yellow-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-lg border border-gray-200 p-4 text-center">
            <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Account Info */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Thông tin tài khoản</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ID</span>
            <span className="font-medium">#{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vai trò</span>
            <span className={`font-semibold ${user.isAdmin ? 'text-indigo-600' : 'text-gray-700'}`}>
              {user.isAdmin ? 'Admin' : 'Người dùng'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Xác thực email</span>
            <span className={user.email_verified_at ? 'text-green-600' : 'text-yellow-600'}>
              {user.email_verified_at ? 'Đã xác thực' : 'Chưa xác thực'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày tham gia</span>
            <span className="font-medium">{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ userId }: { userId: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Đơn hàng</h3>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <ShoppingCart size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Chức năng đang phát triển</p>
        <p className="text-xs text-gray-500 mt-1">Danh sách đơn hàng của người dùng</p>
      </div>
    </div>
  )
}

function ReviewsTab({ userId }: { userId: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Đánh giá</h3>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <Star size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Chức năng đang phát triển</p>
        <p className="text-xs text-gray-500 mt-1">Quản lý đánh giá sản phẩm của người dùng</p>
      </div>
    </div>
  )
}

function AddressesTab({ userId }: { userId: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h3>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <MapPin size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Chức năng đang phát triển</p>
        <p className="text-xs text-gray-500 mt-1">Danh sách địa chỉ giao hàng</p>
      </div>
    </div>
  )
}

function BanksTab({ userId }: { userId: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tài khoản ngân hàng</h3>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <CreditCard size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Chức năng đang phát triển</p>
        <p className="text-xs text-gray-500 mt-1">Quản lý tài khoản ngân hàng liên kết</p>
      </div>
    </div>
  )
}

function ActivityTab({ userId }: { userId: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Lịch sử hoạt động</h3>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <Activity size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Chức năng đang phát triển</p>
        <p className="text-xs text-gray-500 mt-1">Activity logs và login history</p>
      </div>
    </div>
  )
}

function SettingsTab({ user, onPasswordChange, onBan, onDelete, onUnban }: { 
  user: User
  onPasswordChange: () => void
  onBan: () => void
  onDelete: () => void
  onUnban: () => void
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Cài đặt tài khoản</h3>
      
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Bảo mật</h4>
          <button
            onClick={onPasswordChange}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Key size={14} /> Đổi mật khẩu
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Quản lý tài khoản</h4>
          <div className="space-y-2">
            {(user as any).is_banned ? (
              <button
                onClick={onUnban}
                className="flex w-full items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <CheckCircle size={14} /> Kích hoạt lại tài khoản
              </button>
            ) : (
              <button
                onClick={onBan}
                disabled={user.isAdmin}
                className="flex w-full items-center gap-2 rounded-lg border border-orange-300 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
              >
                <Ban size={14} /> Vô hiệu hóa tài khoản
              </button>
            )}
            
            <button
              onClick={onDelete}
              disabled={user.isAdmin}
              className="flex w-full items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} /> Xóa tài khoản vĩnh viễn
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
