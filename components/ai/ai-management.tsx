'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Bot, MessageSquare, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { ToastContainer } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { ProviderCard } from './provider-card'
import { ProviderForm } from './provider-form'
import { AiChat } from './ai-chat'
import type { AiProvider } from '@/types/ai'

type Tab = 'providers' | 'chat'

export function AiManagement() {
  const [tab, setTab] = useState<Tab>('providers')
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AiProvider | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<number | null>(null)
  const { toasts, show, dismiss } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/api/ai-providers')
      setProviders(data.data)
    } catch {
      show('Không thể tải danh sách providers', 'error')
    } finally {
      setLoading(false)
    }
  }, [show])

  useEffect(() => { load() }, [load])

  const handleSave = async (formData: Partial<AiProvider> & { api_key?: string }) => {
    setSaving(true)
    try {
      if (editing) {
        await apiClient.put(`/api/ai-providers/${editing.id}`, formData)
        show('Cập nhật thành công!', 'success')
      } else {
        await apiClient.post('/api/ai-providers', formData)
        show('Thêm provider thành công!', 'success')
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi lưu dữ liệu'
      show(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa provider này?')) return
    try {
      await apiClient.delete(`/api/ai-providers/${id}`)
      show('Đã xóa', 'success')
      load()
    } catch {
      show('Xóa thất bại', 'error')
    }
  }

  const handleTest = async (provider: AiProvider) => {
    setTesting(provider.id)
    try {
      const { data } = await apiClient.post(`/api/ai-providers/${provider.id}/test`)
      show(`✅ Kết nối thành công! Response: "${data.response}" (${data.tokens} tokens)`, 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Kết nối thất bại'
      show(`❌ ${msg}`, 'error')
    } finally {
      setTesting(null)
    }
  }

  const handleToggleActive = async (provider: AiProvider) => {
    try {
      await apiClient.put(`/api/ai-providers/${provider.id}`, { is_active: !provider.is_active })
      load()
    } catch {
      show('Cập nhật thất bại', 'error')
    }
  }

  const handleSetDefault = async (provider: AiProvider) => {
    try {
      await apiClient.put(`/api/ai-providers/${provider.id}`, { is_default: true })
      load()
    } catch {
      show('Cập nhật thất bại', 'error')
    }
  }

  const TABS = [
    { key: 'providers' as Tab, label: 'Providers', icon: Bot },
    { key: 'chat' as Tab,      label: 'AI Chat',   icon: MessageSquare },
  ]

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý AI</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kết nối và quản lý các AI model</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            {tab === 'providers' && (
              <button onClick={() => { setEditing(null); setShowForm(true) }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                <Plus size={15} /> Thêm Provider
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tổng providers', value: providers.length, color: 'text-indigo-600' },
            { label: 'Đang hoạt động', value: providers.filter(p => p.is_active).length, color: 'text-emerald-600' },
            { label: 'Đã tắt', value: providers.filter(p => !p.is_active).length, color: 'text-gray-500' },
            { label: 'Mặc định', value: providers.find(p => p.is_default)?.name ?? 'Chưa có', color: 'text-amber-600', isText: true },
          ].map(({ label, value, color, isText }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`mt-1 text-xl font-bold ${color} ${isText ? 'text-sm' : ''}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'providers' && (
          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
                <Bot size={40} className="mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Chưa có AI provider nào</p>
                <p className="text-xs text-gray-400 mt-1">Thêm provider để bắt đầu sử dụng AI</p>
                <button onClick={() => { setEditing(null); setShowForm(true) }}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  <Plus size={14} /> Thêm Provider
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {providers.map(p => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    testing={testing === p.id}
                    onEdit={() => { setEditing(p); setShowForm(true) }}
                    onDelete={() => handleDelete(p.id)}
                    onTest={() => handleTest(p)}
                    onSetDefault={() => handleSetDefault(p)}
                    onToggleActive={() => handleToggleActive(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'chat' && <AiChat providers={providers} />}
      </div>

      {/* Form modal */}
      {showForm && (
        <ProviderForm
          provider={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
          saving={saving}
        />
      )}
    </>
  )
}
