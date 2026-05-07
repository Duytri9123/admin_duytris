'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import api from '@/lib/api-client'
import { useTableState } from '@/hooks/use-table-state'
import type { User, PaginatedResponse } from '@/types'

type SortField = 'name' | 'email' | 'created_at' | 'isAdmin'
type SortOrder = 'asc' | 'desc'

function UserTableInner() {
  // State persist vào URL — quay lại trang vẫn giữ filter, queryKey giống → dùng cache
  const [state, setState] = useTableState({
    page: 1,
    search: '',
    role: 'all' as 'all' | 'admin' | 'user',
    sortField: 'created_at' as SortField,
    sortOrder: 'desc' as SortOrder,
  })

  const { page, search, role: roleFilter, sortField, sortOrder } = state
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () =>
      api.get<PaginatedResponse<User>>('/api/admin/users', {
        page,
        per_page: 15,
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      }).then((r) => r.data),
  })

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number; isAdmin: boolean }) => {
      const { getCsrfCookie, apiClient } = await import('@/lib/api-client')
      await getCsrfCookie()
      return apiClient.patch(`/api/admin/users/${id}`, { is_admin: isAdmin })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/admin/users/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Xóa thất bại')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return Promise.all(ids.map((id) => api.delete(`/api/admin/users/${id}`).catch(() => null)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      alert('Đã xóa người dùng đã chọn')
    },
  })

  const users = data?.data ?? []
  const lastPage = data?.last_page ?? 1

  // Client-side sorting (không ảnh hưởng queryKey, không fetch lại)
  const sortedUsers = [...users].sort((a, b) => {
    let aVal: any = a[sortField as keyof User]
    let bVal: any = b[sortField as keyof User]

    if (sortField === 'created_at') {
      aVal = new Date(aVal as string).getTime()
      bVal = new Date(bVal as string).getTime()
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = (bVal as string).toLowerCase()
    }

    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setState({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      setState({ sortField: field, sortOrder: 'asc' })
    }
  }

  // Selected users là local state — không cần persist vào URL
  const [selectedUsers, setSelectedUsers] = [
    [] as number[],
    (_: number[]) => {},
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setState({ search: e.target.value })}
            placeholder="Tìm theo tên hoặc email..."
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {(['all', 'admin', 'user'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setState({ role: r })}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r === 'all' ? 'Tất cả' : r === 'admin' ? 'Admin' : 'Người dùng'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>
        ) : isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">Không thể tải dữ liệu</div>
        ) : sortedUsers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Không có người dùng nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Người dùng
                    {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">
                    Email
                    {sortField === 'email' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('isAdmin')}>
                  <div className="flex items-center gap-1">
                    Vai trò
                    {sortField === 'isAdmin' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-4 py-3">Xác thực</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Ngày tạo
                    {sortField === 'created_at' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 uppercase">
                        {user.name?.[0] ?? '?'}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.email_verified_at ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Đã xác thực</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Chưa xác thực</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        <Edit size={12} /> Chỉnh sửa
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa người dùng ${user.name}?`)) {
                            deleteUserMutation.mutate(user.id)
                          }
                        }}
                        disabled={user.isAdmin || deleteUserMutation.isPending}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Trang {page} / {lastPage} · {data?.total ?? 0} người dùng</span>
          <div className="flex gap-2">
            <button
              onClick={() => setState({ page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              onClick={() => setState({ page: Math.min(lastPage, page + 1) })}
              disabled={page === lastPage}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function UserTable() {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>}>
      <UserTableInner />
    </Suspense>
  )
}
