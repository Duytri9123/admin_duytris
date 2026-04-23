import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'
import { AdminSettingsProvider } from '@/lib/admin-settings-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSettingsProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminSettingsProvider>
  )
}
