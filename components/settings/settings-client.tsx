'use client'
import { useState, useEffect, Suspense } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAdminSettings } from '@/lib/admin-settings-context'
import { Save, Globe, Palette, Share2, Search, Settings2, Loader2, Sparkles } from 'lucide-react'
import { ToastContainer } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { useTableState } from '@/hooks/use-table-state'
import { useSettingsStore } from '@/stores/settings-store'
import { TabGeneral }    from './tab-general'
import { TabAppearance } from './tab-appearance'
import { TabAdmin }      from './tab-admin'
import { TabSocial }     from './tab-social'
import { TabSeo }        from './tab-seo'
import { TabBanner }     from './tab-banner'
import { TabSplash }     from './tab-splash'

interface Setting {
  id: number; key: string; value: string | null; type: string; group: string; label: string
}
type SettingsMap = Record<string, Setting[]>

const TABS = [
  { key: 'general',    label: 'Chung',       icon: Globe },
  { key: 'banner',     label: 'Banner',      icon: Settings2 },
  { key: 'appearance', label: 'Giao diện',   icon: Palette },
  { key: 'splash',     label: 'Splash',      icon: Sparkles },
  { key: 'admin',      label: 'Admin',       icon: Settings2 },
  { key: 'social',     label: 'Mạng xã hội', icon: Share2 },
  { key: 'seo',        label: 'SEO',         icon: Search },
]

function SettingsClientInner() {
  // Persist activeTab vào URL — quay lại trang vẫn ở đúng tab
  const [urlState, setUrlState] = useTableState({ tab: 'general' })
  const activeTab = urlState.tab
  const setActiveTab = (tab: string) => setUrlState({ tab })

  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const { toasts, show, dismiss } = useToast()
  const { reload: reloadAdminSettings } = useAdminSettings()
  const queryClient = useQueryClient()

  // Zustand store — persist values vào sessionStorage
  // Tồn tại khi chuyển tab, mất khi đóng/reload trang
  const { pendingValues, initialized, setPendingValues, updateValue, setInitialized, reset } = useSettingsStore()

  // ─── Fetch settings với React Query — cache 30 phút ──────────────────────
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => apiClient.get('/api/admin/settings').then(r => r.data.data as SettingsMap),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  // Khởi tạo values từ server data — chỉ một lần, không override khi đã có pending changes
  useEffect(() => {
    if (settingsData && !initialized) {
      const flat: Record<string, string> = {}
      Object.values(settingsData).forEach(group =>
        group.forEach((s: Setting) => { flat[s.key] = s.value ?? '' })
      )
      setPendingValues(flat)
    }
  }, [settingsData, initialized, setPendingValues])

  // setValues wrapper — cập nhật store thay vì local state
  const setValues = (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    if (typeof updater === 'function') {
      const next = updater(pendingValues)
      setPendingValues(next)
    } else {
      setPendingValues(updater)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.entries(pendingValues).map(([key, value]) => ({ key, value }))
      await apiClient.put('/api/admin/settings', { settings: payload })
      // Invalidate cache + reset store để re-init từ data mới
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      reset() // Xóa pending values — sẽ re-init từ server data mới
      reloadAdminSettings()
      show('Lưu cài đặt thành công!', 'success')
    } catch {
      show('Lưu thất bại!', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (key: string, file: File) => {
    setUploading(key)
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('key', key)
      const { data } = await apiClient.post('/api/admin/settings/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateValue(key, data.data.url)
      reloadAdminSettings()
      show('Upload thành công!', 'success')
    } catch {
      show('Upload thất bại!', 'error')
    } finally {
      setUploading(null)
    }
  }

  const renderTab = () => {
    if (isLoading && !initialized) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )
    }

    const group = settingsData?.[activeTab] ?? []
    switch (activeTab) {
      case 'banner':     return <TabBanner settings={group} values={pendingValues} setValues={setValues} />
      case 'appearance': return <TabAppearance values={pendingValues} setValues={setValues} uploading={uploading} onUpload={(key, file) => handleUpload(key, file)} />
      case 'splash':     return <TabSplash values={pendingValues} setValues={setValues} />
      case 'admin':      return <TabAdmin values={pendingValues} setValues={setValues} uploading={uploading} onUpload={handleUpload} />
      case 'social':     return <TabSocial settings={group} values={pendingValues} setValues={setValues} />
      case 'seo':        return <TabSeo settings={group} values={pendingValues} setValues={setValues} />
      default:           return <TabGeneral settings={group} values={pendingValues} setValues={setValues} />
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cài đặt hệ thống</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý logo, màu sắc và cấu hình website</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (isLoading && !initialized)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors self-start sm:self-auto"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm lg:w-44 lg:flex-col lg:overflow-visible lg:shrink-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
                  activeTab === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-w-0">
            {renderTab()}
          </div>
        </div>
      </div>
    </>
  )
}

export function SettingsClient() {
  return (
    <Suspense fallback={
      <div className="space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    }>
      <SettingsClientInner />
    </Suspense>
  )
}
