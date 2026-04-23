'use client'
import { useState, useEffect } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import type { AiProvider, AiProviderType } from '@/types/ai'
import { PROVIDER_META, CAPABILITIES } from '@/types/ai'

interface Props {
  provider?: AiProvider | null
  onSave: (data: Partial<AiProvider> & { api_key?: string }) => void
  onClose: () => void
  saving: boolean
}

const PROVIDERS: { value: AiProviderType; label: string }[] = [
  { value: 'openai',    label: 'OpenAI' },
  { value: 'google',    label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'ollama',    label: 'Ollama (Local)' },
  { value: 'custom',    label: 'Custom API' },
]

export function ProviderForm({ provider, onSave, onClose, saving }: Props) {
  const [form, setForm] = useState({
    name: '', provider: 'openai' as AiProviderType, model: '',
    api_key: '', base_url: '', is_active: true, is_default: false,
    max_tokens: 2048, temperature: 0.7, capabilities: [] as string[],
    system_prompt: '',
  })
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name, provider: provider.provider, model: provider.model,
        api_key: '', base_url: provider.base_url || '', is_active: provider.is_active,
        is_default: provider.is_default, max_tokens: provider.max_tokens,
        temperature: provider.temperature, capabilities: provider.capabilities || [],
        system_prompt: provider.system_prompt || '',
      })
    }
  }, [provider])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const toggleCap = (c: string) => set('capabilities', form.capabilities.includes(c) ? form.capabilities.filter(x => x !== c) : [...form.capabilities, c])
  const models = PROVIDER_META[form.provider]?.models ?? []
  const needsKey = form.provider !== 'ollama'
  const needsUrl = form.provider === 'ollama' || form.provider === 'custom'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {provider ? 'Chỉnh sửa Provider' : 'Thêm AI Provider'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên hiển thị *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="VD: GPT-4o Production" />
          </div>

          {/* Provider + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Provider *</label>
              <select value={form.provider} onChange={e => { set('provider', e.target.value); set('model', '') }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Model *</label>
              {models.length > 0 ? (
                <select value={form.model} onChange={e => set('model', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">Chọn model</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input value={form.model} onChange={e => set('model', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Nhập tên model" />
              )}
            </div>
          </div>

          {/* API Key */}
          {needsKey && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                API Key {provider ? '(để trống để giữ nguyên)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={form.api_key}
                  onChange={e => set('api_key', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder={provider ? '••••••••••••' : 'sk-...'}
                />
                <button type="button" onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Base URL */}
          {needsUrl && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Base URL {form.provider === 'ollama' ? '(mặc định: localhost:11434)' : '*'}
              </label>
              <input value={form.base_url} onChange={e => set('base_url', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder={form.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'} />
            </div>
          )}

          {/* Params */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Max Tokens</label>
              <input type="number" value={form.max_tokens} onChange={e => set('max_tokens', +e.target.value)}
                min={1} max={128000}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Temperature (0-2)</label>
              <input type="number" value={form.temperature} onChange={e => set('temperature', +e.target.value)}
                min={0} max={2} step={0.1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Khả năng</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map(c => (
                <button key={c} type="button" onClick={() => toggleCap(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.capabilities.includes(c)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">System Prompt (tùy chọn)</label>
            <textarea value={form.system_prompt} onChange={e => set('system_prompt', e.target.value)}
              rows={3} placeholder="Bạn là trợ lý AI cho hệ thống quản lý..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Kích hoạt" />
            <Toggle checked={form.is_default} onChange={v => set('is_default', v)} label="Mặc định" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.model}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {provider ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  )
}
