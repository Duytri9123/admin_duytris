import { Metadata } from 'next'
import { SettingsClient } from '@/components/settings/settings-client'

export const metadata: Metadata = { title: 'Cài đặt hệ thống' }

export default function SettingsPage() {
  return <SettingsClient />
}
