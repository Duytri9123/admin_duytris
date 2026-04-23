'use client'
import { Zap, Trash2, Edit2, CheckCircle, XCircle, Star, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import type { AiProvider } from '@/types/ai'
import { PROVIDER_META } from '@/types/ai'

interface Props {
  provider: AiProvider
  testing: boolean
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
  onSetDefault: () => void
  onToggleActive: () => void
}

export function ProviderCard({ provider, testing, onEdit, onDelete, onTest, onSetDefault, onToggleActive }: Props) {
  const meta = PROVIDER_META[provider.provider]

  return (
    <div className={`relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${provider.is_default ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-200'}`}>
      {/* Default badge */}
      {provider.is_default && (
        <span className="absolute -top-2 left-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
          Mặc định
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Left: info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold" style={{ backgroundColor: meta.color }}>
            {provider.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{provider.name}</h3>
              <Badge variant={provider.is_active ? 'success' : 'default'}>
                {provider.is_active ? 'Hoạt động' : 'Tắt'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{meta.label} · {provider.model}</p>
            {provider.capabilities?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {provider.capabilities.map(c => (
                  <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip content="Test kết nối" side="top">
            <button onClick={onTest} disabled={testing}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 transition-colors">
              {testing ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            </button>
          </Tooltip>
          <Tooltip content={provider.is_default ? 'Đang là mặc định' : 'Đặt làm mặc định'} side="top">
            <button onClick={onSetDefault}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${provider.is_default ? 'text-amber-500' : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'}`}>
              <Star size={15} fill={provider.is_default ? 'currentColor' : 'none'} />
            </button>
          </Tooltip>
          <Tooltip content={provider.is_active ? 'Tắt' : 'Bật'} side="top">
            <button onClick={onToggleActive}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${provider.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}>
              {provider.is_active ? <CheckCircle size={15} /> : <XCircle size={15} />}
            </button>
          </Tooltip>
          <Tooltip content="Chỉnh sửa" side="top">
            <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <Edit2 size={15} />
            </button>
          </Tooltip>
          <Tooltip content="Xóa" side="top">
            <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <Trash2 size={15} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-4 border-t pt-3 text-xs text-gray-500">
        <span>Tokens tối đa: <strong className="text-gray-700">{provider.max_tokens.toLocaleString()}</strong></span>
        <span>Nhiệt độ: <strong className="text-gray-700">{provider.temperature}</strong></span>
      </div>
    </div>
  )
}
