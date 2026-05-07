'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot, X, Send, Loader2, Trash2, Copy, Check, Minimize2, Maximize2,
  Package, Star, Search, Pencil, ChevronDown, AtSign,
  FileText, Image as ImageIcon, Tag, Folder, GripVertical,
  CheckCircle, AlertCircle, ExternalLink, Square, Camera, Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@/types/ai'
import type { Product, PaginatedResponse } from '@/types'

const QUICK_ACTIONS = [
  { icon: Package,   label: 'Tạo sản phẩm', prompt: 'Tạo sản phẩm mới với tên: ' },
  { icon: Folder,    label: 'Tạo danh mục', prompt: 'Tạo danh mục mới tên: ' },
  { icon: FileText,  label: 'Tạo bài viết', prompt: 'Viết bài viết về chủ đề: ' },
  { icon: ImageIcon, label: 'Tạo banner',   prompt: 'Tạo banner quảng cáo cho: ' },
  { icon: Pencil,    label: 'Chỉnh sửa SP', prompt: 'Chỉnh sửa sản phẩm @' },
  { icon: Star,      label: 'Review SP',    prompt: 'Phân tích và review sản phẩm @' },
  { icon: Search,    label: 'Tìm kiếm AI',  prompt: 'Tìm sản phẩm: ' },
  { icon: Tag,       label: 'Tạo SEO',      prompt: 'Tạo meta title, description, keywords cho: ' },
]

interface ActionResult {
  type: 'product_created' | 'category_created' | 'post_created' | 'banner_created' | 'error'
  message: string
  link?: string
}

interface MsgWithMeta extends ChatMessage {
  timestamp: string
  imageUrl?: string
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function ActionCard({ result, onDismiss }: { result: ActionResult; onDismiss: () => void }) {
  const isError = result.type === 'error'
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      {isError ? <AlertCircle size={14} className="shrink-0 text-red-500 mt-0.5" /> : <CheckCircle size={14} className="shrink-0 text-green-600 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${isError ? 'text-red-700' : 'text-green-700'}`}>{result.message}</p>
        {result.link && (
          <a href={result.link} className="mt-1 flex items-center gap-1 text-indigo-600 hover:underline">
            <ExternalLink size={10} /> Xem ngay
          </a>
        )}
      </div>
      <button onClick={onDismiss} className="shrink-0 text-gray-400 hover:text-gray-600"><X size={12} /></button>
    </div>
  )
}

function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>
    )
    return <span key={i}>{rendered}{i < lines.length - 1 && <br />}</span>
  })
}

function ProductMentionPicker({ query, onSelect }: { query: string; onSelect: (p: Product) => void }) {
  const { data } = useQuery({
    queryKey: ['ai-mention', query],
    queryFn: () => apiClient.get<PaginatedResponse<Product>>('/api/products', { params: { search: query, per_page: 5 } }).then(r => r.data.data ?? []),
  })
  const products = data ?? []
  if (!products.length) return <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-3 text-xs text-gray-400">Không tìm thấy</div>
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
      <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
        <AtSign size={10} /> Chọn sản phẩm
      </div>
      {products.map(p => {
        const thumb = p.images?.find(i => i.is_thumbnail)?.url ?? p.images?.[0]?.url
        return (
          <button key={p.id} onClick={() => onSelect(p)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-indigo-50 transition-colors">
            {thumb ? <img src={thumb} alt={p.name} className="h-8 w-8 rounded-lg object-cover border border-gray-200 shrink-0" />
              : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100"><Package size={14} className="text-gray-400" /></div>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">{p.name}</p>
              <p className="text-[10px] text-gray-400">{p.category?.name ?? ''}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function FloatingAiAssistant() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [pos, setPos] = useState({ x: 24, y: 24 })
  const [posReady, setPosReady] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)

  const [panelW, setPanelW] = useState(420)
  const [panelH, setPanelH] = useState(580)
  const resizing = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null)

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<MsgWithMeta[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [convId, setConvId] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [showActions, setShowActions] = useState(true)
  const [actionResults, setActionResults] = useState<ActionResult[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(-1)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPosReady(true)
    setPos({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, actionResults])

  // ── Drag ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    hasDragged.current = false
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    setDragging(true)
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      hasDragged.current = true
      setPos({ x: Math.max(8, Math.min(window.innerWidth - 64, e.clientX - dragOffset.current.x)), y: Math.max(8, Math.min(window.innerHeight - 64, e.clientY - dragOffset.current.y)) })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    hasDragged.current = false
    const t = e.touches[0]
    dragOffset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
  }, [pos])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    hasDragged.current = true
    const t = e.touches[0]
    setPos({ x: Math.max(8, Math.min(window.innerWidth - 64, t.clientX - dragOffset.current.x)), y: Math.max(8, Math.min(window.innerHeight - 64, t.clientY - dragOffset.current.y)) })
  }, [])

  // ── Resize ──
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    resizing.current = { sx: e.clientX, sy: e.clientY, sw: panelW, sh: panelH }
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      setPanelW(Math.max(320, Math.min(700, resizing.current.sw + ev.clientX - resizing.current.sx)))
      setPanelH(Math.max(400, Math.min(850, resizing.current.sh + ev.clientY - resizing.current.sy)))
    }
    const onUp = () => { resizing.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [panelW, panelH])

  // ── Image upload ──
  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      setImageBase64(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  // ── @ mention ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const atIdx = before.lastIndexOf('@')
    if (atIdx !== -1 && !before.slice(atIdx + 1).includes(' ')) {
      setMentionQuery(before.slice(atIdx + 1)); setMentionStart(atIdx)
    } else { setMentionQuery(null); setMentionStart(-1) }
  }

  const handleMentionSelect = (product: Product) => {
    const before = input.slice(0, mentionStart)
    const after = input.slice(mentionStart + 1 + (mentionQuery?.length ?? 0))
    setInput(`${before}@${product.name}${after}`)
    setMentionQuery(null); setMentionStart(-1)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // ── Parse & execute AI action ──
  const parseAndExecuteAction = useCallback(async (content: string) => {
    const match = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (!match) return
    try {
      const { type, data } = JSON.parse(match[1])
      if (type === 'create_product') {
        const res = await apiClient.post('/api/products', data)
        const id = res.data?.data?.id
        setActionResults(p => [...p, { type: 'product_created', message: `✅ Đã tạo sản phẩm "${data.name}"`, link: id ? `/dashboard/products/${id}` : undefined }])
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      } else if (type === 'create_category') {
        await apiClient.post('/api/categories', data)
        setActionResults(p => [...p, { type: 'category_created', message: `✅ Đã tạo danh mục "${data.name}"`, link: '/dashboard/categories' }])
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      } else if (type === 'create_post') {
        const res = await apiClient.post('/api/admin/posts', data)
        const id = res.data?.data?.id
        setActionResults(p => [...p, { type: 'post_created', message: `✅ Đã tạo bài viết "${data.title}"`, link: id ? `/dashboard/posts/${id}/edit` : '/dashboard/posts' }])
      } else if (type === 'create_banner') {
        await apiClient.post('/api/admin/banners', data)
        setActionResults(p => [...p, { type: 'banner_created', message: `✅ Đã tạo banner "${data.title}"`, link: '/dashboard/banners' }])
      } else if (type === 'navigate') {
        router.push(data.url)
      }
    } catch (err: any) {
      setActionResults(p => [...p, { type: 'error', message: `❌ Lỗi thực thi: ${err?.response?.data?.message ?? err.message}` }])
    }
  }, [queryClient, router])

  // ── Send ──
  const send = useCallback(async () => {
    const content = input.trim()
    if ((!content && !imageBase64) || loading) return

    const ts = new Date().toISOString()
    const userMsg: MsgWithMeta = { role: 'user', content: content || '📷 Gửi ảnh để phân tích', timestamp: ts, imageUrl: imagePreview ?? undefined }
    setMessages(m => [...m, userMsg])
    setInput(''); setImagePreview(null)
    setLoading(true); setShowActions(false); setMentionQuery(null)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      // Build messages with image if present
      const apiMessages = [...messages, userMsg].map(m => {
        if (m.imageUrl && m.role === 'user') {
          return {
            role: 'user',
            content: [
              { type: 'text', text: m.content || 'Phân tích ảnh này' },
              { type: 'image_url', image_url: { url: m.imageUrl } }
            ]
          }
        }
        return { role: m.role, content: m.content }
      })

      const { data } = await apiClient.post('/api/ai/chat', {
        messages: apiMessages,
        conversation_id: convId,
        context: imageBase64 ? 'image_analysis' : 'admin_assistant',
        has_image: !!imageBase64,
      })
      setImageBase64(null)
      const assistantContent = data.content
      setMessages(m => [...m, { role: 'assistant', content: assistantContent, timestamp: new Date().toISOString() }])
      setConvId(data.conversation_id ?? null)
      await parseAndExecuteAction(assistantContent)
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      const msg = err?.response?.data?.error ?? 'Lỗi kết nối AI'
      setMessages(m => [...m, { role: 'assistant', content: `❌ ${msg}`, timestamp: new Date().toISOString() }])
    } finally {
      setLoading(false); abortRef.current = null
    }
  }, [input, imageBase64, imagePreview, loading, messages, convId, parseAndExecuteAction])

  const stopGeneration = () => { abortRef.current?.abort(); setLoading(false) }

  const copyMsg = (idx: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(idx); setTimeout(() => setCopied(null), 2000)
  }

  const clearChat = () => { setMessages([]); setConvId(null); setShowActions(true); setActionResults([]); setImagePreview(null); setImageBase64(null) }

  const panelRight = pos.x > (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2
  const panelBottom = pos.y > (typeof window !== 'undefined' ? window.innerHeight : 800) / 2

  if (!posReady) return null

  return (
    <>
      {/* Floating button */}
      <button
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={() => { if (!hasDragged.current) setOpen(p => !p) }}
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95 ${open ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} ${dragging ? 'scale-110 shadow-2xl' : ''}`}
        aria-label="AI Assistant"
      >
        {open ? <X size={22} /> : (
          <div className="relative">
            <Bot size={22} />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-200" />
            </span>
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed', zIndex: 9998,
            ...(panelRight ? { right: window.innerWidth - pos.x - 56 } : { left: pos.x }),
            ...(panelBottom ? { bottom: window.innerHeight - pos.y + 8 } : { top: pos.y + 64 }),
            width: Math.min(panelW, window.innerWidth - 32),
            height: minimized ? 'auto' : panelH,
          }}
          className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-white" />
              <span className="text-sm font-semibold text-white">AI Assistant</span>
              {loading && <Loader2 size={13} className="animate-spin text-indigo-200" />}
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && <button onClick={clearChat} className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-700" title="Xóa chat"><Trash2 size={13} /></button>}
              <button onClick={() => setMinimized(p => !p)} className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-700">{minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}</button>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-700"><X size={13} /></button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages — fixed height with scroll */}
              <div
                className="overflow-y-auto p-3 space-y-4"
                style={{ height: panelH - 220, minHeight: 200 }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <Bot size={36} className="mb-2 opacity-20" />
                    <p className="text-xs font-semibold text-gray-600">Xin chào! Tôi có thể giúp bạn</p>
                    <p className="text-[11px] mt-0.5 text-gray-400">Tạo SP · Bài viết · Banner · Danh mục</p>
                    <p className="text-[10px] mt-1.5 text-indigo-400">📷 Hỗ trợ phân tích ảnh · @ chọn sản phẩm</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isUser = msg.role === 'user'
                    const displayContent = msg.content.replace(/```json[\s\S]*?```/g, '').trim()
                    return (
                      <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] ${isUser ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                          {isUser ? 'U' : <Bot size={11} />}
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                          {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="uploaded" className="rounded-xl max-h-40 object-cover border border-gray-200" />
                          )}
                          {displayContent && (
                            <div className={`group relative rounded-2xl px-3 py-2 text-sm leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                              <p className="whitespace-pre-wrap">{renderContent(displayContent)}</p>
                              {/* Copy button */}
                              <button
                                onClick={() => copyMsg(i, msg.content)}
                                className={`absolute -bottom-5 ${isUser ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600`}
                              >
                                {copied === i ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
                                {copied === i ? 'Đã copy' : 'Copy'}
                              </button>
                            </div>
                          )}
                          {/* Timestamp */}
                          <div className={`flex items-center gap-1 text-[9px] text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <Clock size={8} />
                            {fmtTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Action results */}
                {actionResults.map((r, i) => (
                  <ActionCard key={i} result={r} onDismiss={() => setActionResults(p => p.filter((_, j) => j !== i))} />
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white"><Bot size={11} /></div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2">
                      {[0,1,2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick actions */}
              {showActions && (
                <div className="border-t border-gray-100 px-3 py-2 shrink-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Thao tác nhanh</span>
                    <button onClick={() => setShowActions(false)} className="text-gray-300 hover:text-gray-500"><ChevronDown size={12} /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                      <button key={label} onClick={() => { setInput(prompt); setTimeout(() => textareaRef.current?.focus(), 50) }}
                        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-2 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                        <Icon size={13} className="shrink-0 text-indigo-500" />
                        <span className="text-[9px] font-medium text-gray-600 leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image preview */}
              {imagePreview && (
                <div className="border-t border-gray-100 px-3 py-2 shrink-0">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="h-16 rounded-lg border border-gray-200 object-cover" />
                    <button onClick={() => { setImagePreview(null); setImageBase64(null) }}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
                      <X size={10} />
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-indigo-500">📷 Ảnh sẽ được gửi kèm tin nhắn</p>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-100 p-2.5 shrink-0">
                {mentionQuery !== null && (
                  <div className="mb-2"><ProductMentionPicker query={mentionQuery} onSelect={handleMentionSelect} /></div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setMentionQuery(null); return }
                      if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) { e.preventDefault(); void send() }
                    }}
                    placeholder="Nhập câu hỏi... (@ chọn SP, Enter gửi, Shift+Enter xuống dòng)"
                    rows={3}
                    className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    style={{ minHeight: 72 }}
                  />
                  <div className="flex flex-col gap-1.5">
                    {/* Image upload */}
                    <button onClick={() => imgInputRef.current?.click()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                      title="Gửi ảnh để AI phân tích">
                      <Camera size={14} />
                    </button>
                    {/* Stop / Send */}
                    {loading ? (
                      <button onClick={stopGeneration}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Dừng">
                        <Square size={12} fill="white" />
                      </button>
                    ) : (
                      <button onClick={send} disabled={(!input.trim() && !imageBase64)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                        <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {!showActions && messages.length > 0 && (
                  <button onClick={() => setShowActions(true)} className="mt-1.5 flex w-full items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-indigo-500">
                    <Bot size={10} /> Thao tác nhanh
                  </button>
                )}
              </div>

              {/* Resize handle */}
              <div onMouseDown={onResizeStart}
                className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-70"
                title="Kéo để thay đổi kích thước">
                <GripVertical size={12} className="rotate-45 text-gray-500" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden image input */}
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }} />
    </>
  )
}
