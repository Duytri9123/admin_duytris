'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { AiProvider, ChatMessage } from '@/types/ai'

interface Props {
  providers: AiProvider[]
}

export function AiChat({ providers }: Props) {
  const activeProviders = providers.filter(p => p.is_active)
  const defaultProvider = activeProviders.find(p => p.is_default) ?? activeProviders[0]

  const [selectedId, setSelectedId] = useState<number | null>(defaultProvider?.id ?? null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !selectedId || loading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await apiClient.post('/api/ai/chat', {
        provider_id: selectedId,
        messages: [...messages, userMsg],
        conversation_id: convId,
        context: 'admin',
      })
      setMessages(m => [...m, { role: 'assistant', content: data.content }])
      setConvId(data.conversation_id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Lỗi kết nối AI'
      setMessages(m => [...m, { role: 'assistant', content: `❌ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  const copyMsg = (idx: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const clearChat = () => { setMessages([]); setConvId(null) }

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Bot size={18} className="text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">AI Chat</span>
          {activeProviders.length > 0 && (
            <select
              value={selectedId ?? ''}
              onChange={e => setSelectedId(+e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:outline-none focus:border-indigo-400"
            >
              {activeProviders.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors">
            <Trash2 size={13} /> Xóa chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <Bot size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Bắt đầu cuộc trò chuyện</p>
            <p className="text-xs mt-1">Hỏi AI về sản phẩm, đơn hàng, phân tích dữ liệu...</p>
            {/* Quick prompts */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                'Phân tích doanh thu tháng này',
                'Gợi ý mô tả sản phẩm',
                'Tối ưu giá bán',
                'Xu hướng thị trường',
              ].map(p => (
                <button key={p} onClick={() => setInput(p)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>
              {/* Bubble */}
              <div className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {/* Copy button */}
                <button
                  onClick={() => copyMsg(i, msg.content)}
                  className={`absolute -bottom-6 ${msg.role === 'user' ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600`}
                >
                  {copied === i ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                  {copied === i ? 'Đã copy' : 'Copy'}
                </button>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-700 text-white">
              <Bot size={13} />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
              <Loader2 size={14} className="animate-spin text-gray-500" />
              <span className="text-xs text-gray-500">Đang xử lý...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {activeProviders.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-2">Chưa có AI provider nào hoạt động. Thêm và kích hoạt provider để bắt đầu.</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-h-32"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
