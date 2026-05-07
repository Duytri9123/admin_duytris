// Server component — không re-render khi navigate
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'
import { AdminSettingsProvider } from '@/lib/admin-settings-context'
import { FloatingAiAssistant } from '@/components/ai/floating-ai-assistant'
import { PushNotificationsInit } from '@/components/layout/push-notifications-init'

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
      <FloatingAiAssistant />
      <PushNotificationsInit />
    </AdminSettingsProvider>
  )
}
