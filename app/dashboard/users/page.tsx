'use client'

import { UserTable } from '@/components/users/user-table'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
      </div>
      <UserTable />
    </div>
  )
}
