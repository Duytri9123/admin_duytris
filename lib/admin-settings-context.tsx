'use client'
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { apiClient } from './api-client'

export interface AdminSettings {
  // Appearance
  admin_sidebar_theme: string    // 'dark' | 'light'
  admin_accent_color: string     // hex color
  admin_sidebar_collapsed: string
  admin_compact_mode: string
  admin_show_breadcrumb: string
  admin_per_page: string
  // Branding
  admin_logo_url: string
  admin_site_name: string
  // Fallback to site settings
  logo_url: string
  site_name: string
}

const DEFAULTS: AdminSettings = {
  admin_sidebar_theme: 'dark',
  admin_accent_color: '#6366f1',
  admin_sidebar_collapsed: '0',
  admin_compact_mode: '0',
  admin_show_breadcrumb: '1',
  admin_per_page: '15',
  admin_logo_url: '',
  admin_site_name: '',
  logo_url: '',
  site_name: 'Admin Panel',
}

interface AdminSettingsContextValue {
  settings: AdminSettings
  reload: () => void
}

const AdminSettingsContext = createContext<AdminSettingsContextValue>({
  settings: DEFAULTS,
  reload: () => {},
})

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULTS)
  const loaded = useRef(false)

  const load = useCallback(() => {
    loaded.current = true
    apiClient.get('/api/settings/flat')
      .then(({ data }) => {
        setSettings({ ...DEFAULTS, ...data.data })
      })
      .catch(() => { loaded.current = false }) // Reset nếu lỗi để có thể retry
  }, [])

  const reload = useCallback(() => {
    loaded.current = false
    load()
  }, [load])

  useEffect(() => { load() }, []) // Empty deps — chỉ chạy 1 lần khi mount

  return (
    <AdminSettingsContext.Provider value={{ settings, reload }}>
      {children}
    </AdminSettingsContext.Provider>
  )
}

export function useAdminSettings() {
  return useContext(AdminSettingsContext)
}
