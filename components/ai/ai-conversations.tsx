'use client'

import { useState, useCallback, useEffect } from 'react'
import { MessageSquare, Trash2, RefreshCw, ChevronRight, Bot, Clock, Coins } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { AiConversation, ChatMessage } from '@/types/ai'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function previewText(messages: ChatMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === 'assistant')
  return last?.content?.slice(0, 100) ?? '...'
}

const CONTEXT_LABEL: Record<string, string> = {
  admin: 'Admin Chat',
  admin_assistant: 'AI Assistant',
  product: 'Sản phẩm',
  analytics: 'Phân tích',
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function ConversationDetail({ conv, onClose, onDelete }: {
  conv: AiConversation
  onClose: () => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{conv.title || 'Cuộc hội thoại'}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock size={10} /> {fmtDate(conv.updated_at)}
            <span className="mx-1">·</span>
            <Coins size={10} /> {conv.total_tokens?.toLocaleString() ?? 0} tokens
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { onDelete(conv.id); onClose() }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Xóa hội thoại"
          >
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conv.messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] ${isUser ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                {isUser ? 'U' : <Bot size={11} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AiConversations() {
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AiConversation | null>(null)
  const [search, setSearch] = useState('')
  const [filterCtx, setFilterCtx] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/api/ai/conversations')
      setConversations(data.data ?? data ?? [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa hội thoại này?')) return
    try {
      await apiClient.delete(`/api/ai/conversations/${id}`)
      setConversations((p) => p.filter((c) => c.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch { /* ignore */ }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Xóa tất cả hội thoại?')) return
    try {
      await apiClient.delete('/api/ai/conversations')
      setConversations([])
      setSelected(null)
    } catch { /* ignore */ }
  }

  const contexts = ['all', ...Array.from(new Set(conversations.map((c) => c.context).filter(Boolean)))]

  const filtered = conversations.filter((c) => {
    const matchCtx = filterCtx === 'all' || c.context === filterCtx
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()))
    return matchCtx && matchSearch
  })

  return (
    <div className="flex h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Sidebar list */}
      <div className={`flex flex-col border-r border-gray-200 ${selected ? 'hidden sm:flex sm:w-72' : 'w-full sm:w-72'}`}>
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {filtered.length} hội thoại
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => void load()} className="rounded p-1 text-gray-400 hover:text-gray-600" title="Làm mới">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              {conversations.length > 0 && (
                <button onClick={handleDeleteAll} className="rounded p-1 text-gray-400 hover:text-red-500" title="Xóa tất cả">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm hội thoại..."
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {contexts.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {contexts.map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => setFilterCtx(ctx)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    filterCtx === ctx ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ctx === 'all' ? 'Tất cả' : (CONTEXT_LABEL[ctx] ?? ctx)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <MessageSquare size={28} className="mb-2 opacity-30" />
              <p className="text-xs">Chưa có hội thoại nào</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`w-full border-b border-gray-100 px-3 py-3 text-left transition-colors hover:bg-gray-50 ${
                  selected?.id === conv.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800">
                      {conv.title || 'Cuộc hội thoại'}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-400 leading-relaxed">
                      {previewText(conv.messages)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                        {CONTEXT_LABEL[conv.context] ?? conv.context}
                      </span>
                      <span className="text-[9px] text-gray-400">{fmtDate(conv.updated_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="mt-1 shrink-0 text-gray-300" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ConversationDetail conv={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center text-center text-gray-400">
          <div>
            <MessageSquare size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Chọn một hội thoại để xem</p>
          </div>
        </div>
      )}
    </div>
  )
}
