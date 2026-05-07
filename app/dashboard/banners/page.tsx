'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Image as ImageIcon, Plus, Pencil, Trash2, X, Eye, EyeOff,
  ExternalLink, Upload, Crop, Check, RotateCcw, ChevronDown, ChevronUp,
  ShoppingCart,
} from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import api, { apiClient } from '@/lib/api-client'

interface Banner {
  id: number
  title: string
  subtitle?: string
  image_url: string
  aspect_ratio?: string
  link_url?: string
  button_text?: string
  button_style?: string // JSON string
  is_active: boolean
  sort_order: number
  text_overlays?: string // JSON string
  created_at: string
}

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9 (Widescreen)', ratio: 16 / 9 },
  { value: '16:5', label: '16:5 (Ultra Wide)', ratio: 16 / 5 },
  { value: '21:9', label: '21:9 (Cinematic)', ratio: 21 / 9 },
]

// ─── Canvas crop helper ───────────────────────────────────────────────────────
async function getCroppedBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        
        // Giới hạn kích thước output để tránh file quá lớn
        const maxWidth = 1920
        const scale = cropArea.width > maxWidth ? maxWidth / cropArea.width : 1
        
        canvas.width = cropArea.width * scale
        canvas.height = cropArea.height * scale
        
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, canvas.width, canvas.height
        )
        
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        }, 'image/jpeg', 0.85)
      } catch (err) {
        reject(err)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image. CORS may be blocking.'))
    img.src = imageSrc
  })
}

// ─── Image Crop Modal ─────────────────────────────────────────────────────────
function CropModal({
  src,
  aspect,
  onDone,
  onCancel,
}: {
  src: string
  aspect: number
  onDone: (blob: Blob, preview: string) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const handleDone = async () => {
    if (!croppedArea) return
    try {
      const blob = await getCroppedBlob(src, croppedArea)
      onDone(blob, URL.createObjectURL(blob))
    } catch (err) {
      console.error('Crop error:', err)
      alert('Không thể cắt ảnh từ URL này do CORS. Vui lòng dùng ảnh gốc hoặc upload file.')
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Crop size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">Cắt ảnh banner</h3>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        {/* Crop area */}
        <div className="relative bg-gray-900" style={{ height: 340 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_: Area, px: Area) => setCroppedArea(px)}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500 w-10">Zoom</span>
          <input
            type="range" min={1} max={3} step={0.05} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-xs text-gray-500 w-10 text-right">{zoom.toFixed(1)}×</span>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={handleDone}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Check size={14} /> Xác nhận cắt
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helper: hex + opacity → rgba ────────────────────────────────────────────
function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

// ─── Banner form modal ────────────────────────────────────────────────────────
function BannerModal({ banner, onClose }: { banner?: Banner; onClose: () => void }) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    link_url: banner?.link_url ?? '',
    button_text: banner?.button_text ?? '',
    aspect_ratio: banner?.aspect_ratio ?? '16:5',
    is_active: banner?.is_active ?? true,
  })
  const [preview, setPreview] = useState<string>(banner?.image_url ?? '')
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRecropping, setIsRecropping] = useState(false)
  const [customAspect, setCustomAspect] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)

  // Button style state
  const [buttonStyle, setButtonStyle] = useState<{
    position: { x: number; y: number }
    bgColor: string
    bgOpacity: number
    textColor: string
    borderColor: string
    borderWidth: number
    borderRadius: number
    paddingX: number
    paddingY: number
    fontSize: number
    fontWeight: string
    showIcon: boolean
  }>(() => {
    const DEFAULT_BTN = {
        position: { x: 50, y: 85 },
        bgColor: '#ffffff',
        bgOpacity: 0.15,
        textColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 999,
        paddingX: 1.6,
        paddingY: 0.7,
        fontSize: 20,
        fontWeight: 'bold',
        showIcon: true,
      }
    try {
      const parsed = banner?.button_style ? JSON.parse(banner.button_style) : null
      if (!parsed) return DEFAULT_BTN
      // Migrate old px values (> 5) to em
      if (parsed.paddingX > 5) parsed.paddingX = Math.round((parsed.paddingX / 14) * 10) / 10
      if (parsed.paddingY > 5) parsed.paddingY = Math.round((parsed.paddingY / 14) * 10) / 10
      // Migrate old px fontSize (> 10) to cqw units (same scale as text overlays: value/10 = cqw)
      if (parsed.fontSize > 10) parsed.fontSize = Math.round(parsed.fontSize * 1.5)
      return { ...DEFAULT_BTN, ...parsed }
    } catch {
      return DEFAULT_BTN
    }
  })
  const [btnCollapsed, setBtnCollapsed] = useState(true)
  
  // Text overlay configuration
  const [textOverlays, setTextOverlays] = useState<Array<{
    id: string
    text: string
    fontSize: number
    color: string
    position: { x: number; y: number }
    fontWeight: string
    animation?: string
    // New styling fields
    bgColor?: string
    bgOpacity?: number
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    italic?: boolean
    letterSpacing?: number
  }>>(() => {
    try {
      return banner?.text_overlays ? JSON.parse(banner.text_overlays) : []
    } catch {
      return []
    }
  })
  // Track which overlay cards are collapsed (by id)
  const [collapsedOverlays, setCollapsedOverlays] = useState<Set<string>>(new Set())

  // Kiểm tra xem aspect_ratio hiện tại có trong preset không
  const isCustomAspectRatio = !ASPECT_OPTIONS.some(opt => opt.value === form.aspect_ratio)
  
  const selectedAspect = ASPECT_OPTIONS.find((a) => a.value === form.aspect_ratio) ?? {
    value: form.aspect_ratio,
    label: form.aspect_ratio,
    ratio: (() => {
      const [w, h] = form.aspect_ratio.split(':').map(Number)
      return w / h
    })()
  }

  const mutation = useMutation({
    mutationFn: async () => {
      // Validate: phải có ảnh (upload hoặc URL) khi tạo mới
      if (!banner && !croppedBlob && !imageUrl.trim()) {
        throw new Error('Vui lòng chọn ảnh banner hoặc nhập URL ảnh')
      }

      // Lấy CSRF token trước khi gửi multipart/form-data
      await apiClient.get('/sanctum/csrf-cookie')

      const fd = new FormData()
      if (form.title?.trim()) fd.append('title', form.title.trim())
      if (form.subtitle?.trim()) fd.append('subtitle', form.subtitle.trim())
      if (form.link_url?.trim()) fd.append('link_url', form.link_url.trim())
      if (form.button_text?.trim()) fd.append('button_text', form.button_text.trim())
      fd.append('aspect_ratio', form.aspect_ratio)
      fd.append('is_active', form.is_active ? '1' : '0')
      
      // Text overlays
      if (textOverlays.length > 0) {
        fd.append('text_overlays', JSON.stringify(textOverlays))
      }
      
      // Button style (always save if button_text is set)
      if (form.button_text?.trim()) {
        fd.append('button_style', JSON.stringify(buttonStyle))
      }
      
      // Ưu tiên: 1. Upload file, 2. URL ảnh
      if (croppedBlob) {
        console.log('Cropped blob size:', croppedBlob.size, 'bytes')
        fd.append('image', croppedBlob, 'banner.jpg')
      } else if (imageUrl.trim()) {
        fd.append('image_url', imageUrl.trim())
      }

      // Debug: log form data
      console.log('Submitting banner with:', {
        title: form.title,
        aspect_ratio: form.aspect_ratio,
        is_active: form.is_active,
        hasImage: !!croppedBlob,
        imageSize: croppedBlob?.size,
        imageUrl: imageUrl || null,
      })

      if (banner) {
        fd.append('_method', 'PUT')
        return apiClient.post(`/api/admin/banners/${banner.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      return apiClient.post('/api/admin/banners', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      console.error('Banner creation error:', e?.response?.data)
      const msgs = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message ?? e?.message
      setError(msgs ?? 'Đã xảy ra lỗi')
    },
  })

  const handleFileSelect = (f: File) => {
    const url = URL.createObjectURL(f)
    setCropSrc(url)   // mở crop modal
  }

  const handleCropDone = useCallback((blob: Blob, previewUrl: string) => {
    setCroppedBlob(blob)
    setPreview(previewUrl)
    setCropSrc(null)
    setIsRecropping(false)
  }, [])

  const handleReset = () => {
    setCroppedBlob(null)
    setPreview(banner?.image_url ?? '')
    setIsRecropping(false)
    setImageUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // Crop lại ảnh hiện tại với tỉ lệ mới
  const handleRecropExisting = () => {
    if (banner?.image_url) {
      setIsRecropping(true)
      setCropSrc(banner.image_url)
    }
  }

  // Load ảnh từ URL
  const handleLoadImageUrl = async () => {
    if (!imageUrl.trim()) return
    
    setIsLoadingUrl(true)
    setError(null)
    
    try {
      // Kiểm tra URL có hợp lệ không
      new URL(imageUrl.trim())
      
      // Tạo preview từ URL
      setPreview(imageUrl.trim())
      setCroppedBlob(null) // Clear uploaded file nếu có
      
      // Thử mở crop modal - nếu CORS lỗi thì vẫn dùng URL gốc
      try {
        setCropSrc(imageUrl.trim())
      } catch (corsErr) {
        console.warn('CORS error, using original URL:', corsErr)
        // Vẫn dùng URL gốc, không crop
      }
    } catch (err) {
      setError('URL ảnh không hợp lệ')
    } finally {
      setIsLoadingUrl(false)
    }
  }

  // Khi đổi aspect ratio, nếu đang edit banner có ảnh, cho phép crop lại
  const handleAspectChange = (newAspect: string) => {
    setForm((p) => ({ ...p, aspect_ratio: newAspect }))
    setCustomAspect('') // Clear custom input khi chọn preset
    // Nếu đang edit và có ảnh gốc, reset về ảnh gốc để crop lại
    if (banner?.image_url && !isRecropping) {
      setCroppedBlob(null)
      setPreview(banner.image_url)
    }
  }

  // Áp dụng tỉ lệ tùy chỉnh
  const handleCustomAspectApply = () => {
    if (customAspect.match(/^\d+:\d+$/)) {
      setForm((p) => ({ ...p, aspect_ratio: customAspect }))
      // Reset crop nếu đang edit
      if (banner?.image_url && !isRecropping) {
        setCroppedBlob(null)
        setPreview(banner.image_url)
      }
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100">
                <ImageIcon size={16} className="text-pink-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                {banner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
              </h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <X size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!banner && !croppedBlob && !imageUrl.trim() && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                <span className="text-base">⚠️</span>
                <span>Vui lòng chọn ảnh upload hoặc nhập URL ảnh trước khi tạo banner</span>
              </div>
            )}

            {/* Image URL input */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">URL ảnh từ internet</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onBlur={() => {
                    // Auto preview khi blur
                    if (imageUrl.trim()) {
                      try {
                        new URL(imageUrl.trim())
                        setPreview(imageUrl.trim())
                        setCroppedBlob(null)
                      } catch {}
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={handleLoadImageUrl}
                  disabled={!imageUrl.trim() || isLoadingUrl}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingUrl ? (
                    <>Đang tải...</>
                  ) : (
                    <>
                      <Crop size={14} /> Crop ảnh
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Nhập URL → Tự động preview. Nhấn "Crop ảnh" nếu muốn cắt (có thể bị lỗi CORS với ảnh từ domain khác)
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">HOẶC</span>
              </div>
            </div>

            {/* Image upload + crop */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Hình ảnh banner</label>
                <div className="flex items-center gap-1.5">
                  {banner?.image_url && !croppedBlob && (
                    <button
                      type="button"
                      onClick={handleRecropExisting}
                      className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100"
                    >
                      <Crop size={11} /> Điều chỉnh khung hình
                    </button>
                  )}
                  {croppedBlob && (
                    <button
                      type="button"
                      onClick={() => setCropSrc(URL.createObjectURL(croppedBlob))}
                      className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                    >
                      <Crop size={11} /> Cắt lại
                    </button>
                  )}
                  {(croppedBlob || (preview && preview !== banner?.image_url)) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <RotateCcw size={11} /> Đặt lại
                    </button>
                  )}
                </div>
              </div>

              {/* Aspect ratio selector */}
              <div className="mb-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Tỉ lệ khung hình</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAspectChange(opt.value)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                        form.aspect_ratio === opt.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {/* Input tùy chỉnh */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customAspect}
                    onChange={(e) => setCustomAspect(e.target.value)}
                    placeholder="Tùy chỉnh (vd: 2:1)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCustomAspectApply}
                    disabled={!customAspect.match(/^\d+:\d+$/)}
                    className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Áp dụng
                  </button>
                </div>
                
                {isCustomAspectRatio && (
                  <p className="mt-1 text-xs text-gray-500">
                    Đang dùng tỉ lệ tùy chỉnh: <span className="font-semibold text-indigo-600">{form.aspect_ratio}</span>
                  </p>
                )}
                
                {banner?.image_url && form.aspect_ratio !== banner.aspect_ratio && !croppedBlob && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                    <span>⚠️</span>
                    <span>Tỉ lệ đã thay đổi. Nhấn "Điều chỉnh khung hình" để cắt lại ảnh.</span>
                  </p>
                )}
              </div>

              {/* Text Overlays */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Chữ trên banner</label>
                  <button
                    type="button"
                    onClick={() => {
                      const id = Math.random().toString(36).slice(2)
                      setTextOverlays(prev => [...prev, {
                        id,
                        text: 'Text mới',
                        fontSize: 6,
                        color: '#ffffff',
                        position: { x: 50, y: 50 },
                        fontWeight: 'bold',
                        animation: 'fade-in',
                        bgColor: '#000000',
                        bgOpacity: 0,
                        borderColor: '#ffffff',
                        borderWidth: 0,
                        borderRadius: 0,
                        paddingX: 12,
                        paddingY: 6,
                        italic: false,
                        letterSpacing: 0,
                      }])
                    }}
                    className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-100"
                  >
                    <Plus size={12} /> Thêm chữ
                  </button>
                </div>

                {textOverlays.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {textOverlays.map((overlay, idx) => {
                      const isCollapsed = collapsedOverlays.has(overlay.id)
                      const toggleCollapse = () =>
                        setCollapsedOverlays(prev => {
                          const next = new Set(prev)
                          if (next.has(overlay.id)) next.delete(overlay.id)
                          else next.add(overlay.id)
                          return next
                        })
                      const upd = <K extends keyof typeof overlay>(key: K, val: typeof overlay[K]) =>
                        setTextOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, [key]: val } : o))

                      return (
                        <div key={overlay.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                          {/* Header row — always visible */}
                          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                            <button
                              type="button"
                              onClick={toggleCollapse}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                              <span className="text-xs font-semibold text-gray-700">Text #{idx + 1}</span>
                              {isCollapsed && (
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{overlay.text}</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextOverlays(prev => prev.filter(o => o.id !== overlay.id))}
                              className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                              title="Xóa text"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Collapsible body */}
                          {!isCollapsed && (
                            <div className="p-3 space-y-3">
                              {/* Text content */}
                              <input
                                value={overlay.text}
                                onChange={(e) => upd('text', e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                placeholder="Nội dung text"
                              />

                              {/* Size + Color */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Cỡ chữ (% rộng)</label>
                                  <input
                                    type="number"
                                    value={overlay.fontSize}
                                    onChange={(e) => upd('fontSize', e.target.value === '' ? 2 : Number(e.target.value))}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    min="1" max="50" step="1"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Màu chữ</label>
                                  <input
                                    type="color"
                                    value={overlay.color}
                                    onChange={(e) => upd('color', e.target.value)}
                                    className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                                  />
                                </div>
                              </div>

                              {/* Position */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Vị trí X (%)</label>
                                  <input
                                    type="number"
                                    value={overlay.position.x}
                                    onChange={(e) => upd('position', { ...overlay.position, x: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    min="0" max="100" step="1"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Vị trí Y (%)</label>
                                  <input
                                    type="number"
                                    value={overlay.position.y}
                                    onChange={(e) => upd('position', { ...overlay.position, y: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    min="0" max="100" step="1"
                                  />
                                </div>
                              </div>

                              {/* Font weight + Italic */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Độ đậm</label>
                                  <select
                                    value={overlay.fontWeight}
                                    onChange={(e) => upd('fontWeight', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                    <option value="900">Extra Bold</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Kiểu chữ</label>
                                  <button
                                    type="button"
                                    onClick={() => upd('italic', !overlay.italic)}
                                    className={`w-full rounded border px-2 py-1 text-sm font-medium transition-colors ${
                                      overlay.italic
                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                    }`}
                                  >
                                    <span className="italic">I</span> Nghiêng
                                  </button>
                                </div>
                              </div>

                              {/* Letter spacing */}
                              <div>
                                <label className="mb-1 block text-[11px] font-medium text-gray-500">
                                  Giãn chữ (px): <span className="text-indigo-600">{overlay.letterSpacing ?? 0}</span>
                                </label>
                                <input
                                  type="range"
                                  min="-2" max="20" step="0.5"
                                  value={overlay.letterSpacing ?? 0}
                                  onChange={(e) => upd('letterSpacing', Number(e.target.value))}
                                  className="w-full accent-indigo-600"
                                />
                              </div>

                              {/* Animation */}
                              <div>
                                <label className="mb-1 block text-[11px] font-medium text-gray-500">Hiệu ứng xuất hiện</label>
                                <select
                                  value={overlay.animation || 'none'}
                                  onChange={(e) => upd('animation', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                >
                                  <option value="none">Không có</option>
                                  <option value="fade-in">Fade In (Mờ dần)</option>
                                  <option value="slide-left">Slide từ trái</option>
                                  <option value="slide-right">Slide từ phải</option>
                                  <option value="slide-up">Slide từ dưới</option>
                                  <option value="bounce">Bounce (Nảy)</option>
                                  <option value="zoom-in">Zoom In (Phóng to)</option>
                                </select>
                              </div>

                              {/* ── Background section ── */}
                              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-2">
                                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Nền chữ</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[11px] font-medium text-gray-500">Màu nền</label>
                                    <input
                                      type="color"
                                      value={overlay.bgColor ?? '#000000'}
                                      onChange={(e) => upd('bgColor', e.target.value)}
                                      className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[11px] font-medium text-gray-500">
                                      Độ mờ nền: <span className="text-indigo-600">{Math.round((overlay.bgOpacity ?? 0) * 100)}%</span>
                                    </label>
                                    <input
                                      type="range"
                                      min="0" max="1" step="0.05"
                                      value={overlay.bgOpacity ?? 0}
                                      onChange={(e) => upd('bgOpacity', Number(e.target.value))}
                                      className="w-full accent-indigo-600 mt-1"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[11px] font-medium text-gray-500">Padding ngang (px)</label>
                                    <input
                                      type="number"
                                      value={overlay.paddingX ?? 12}
                                      onChange={(e) => upd('paddingX', Number(e.target.value))}
                                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                      min="0" max="60"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[11px] font-medium text-gray-500">Padding dọc (px)</label>
                                    <input
                                      type="number"
                                      value={overlay.paddingY ?? 6}
                                      onChange={(e) => upd('paddingY', Number(e.target.value))}
                                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                      min="0" max="40"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Bo góc (px)</label>
                                  <input
                                    type="number"
                                    value={overlay.borderRadius ?? 0}
                                    onChange={(e) => upd('borderRadius', Number(e.target.value))}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    min="0" max="100"
                                  />
                                </div>
                              </div>

                              {/* ── Border section ── */}
                              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-2">
                                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Viền (Border)</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[11px] font-medium text-gray-500">Màu viền</label>
                                    <input
                                      type="color"
                                      value={overlay.borderColor ?? '#ffffff'}
                                      onChange={(e) => upd('borderColor', e.target.value)}
                                      className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[11px] font-medium text-gray-500">Độ dày viền (px)</label>
                                    <input
                                      type="number"
                                      value={overlay.borderWidth ?? 0}
                                      onChange={(e) => upd('borderWidth', Number(e.target.value))}
                                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                      min="0" max="10"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Live preview chip */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">Xem trước:</span>
                                <span
                                  style={{
                                    color: overlay.color,
                                    fontWeight: overlay.fontWeight,
                                    fontStyle: overlay.italic ? 'italic' : 'normal',
                                    letterSpacing: overlay.letterSpacing ? `${overlay.letterSpacing}px` : undefined,
                                    backgroundColor: overlay.bgOpacity && overlay.bgOpacity > 0
                                      ? hexToRgba(overlay.bgColor ?? '#000000', overlay.bgOpacity)
                                      : 'transparent',
                                    border: (overlay.borderWidth ?? 0) > 0
                                      ? `${overlay.borderWidth}px solid ${overlay.borderColor ?? '#ffffff'}`
                                      : 'none',
                                    borderRadius: overlay.borderRadius ? `${overlay.borderRadius}px` : undefined,
                                    paddingLeft: `${overlay.paddingX ?? 12}px`,
                                    paddingRight: `${overlay.paddingX ?? 12}px`,
                                    paddingTop: `${overlay.paddingY ?? 6}px`,
                                    paddingBottom: `${overlay.paddingY ?? 6}px`,
                                    fontSize: '13px',
                                    textShadow: !(overlay.bgOpacity && overlay.bgOpacity > 0) ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                                    background: overlay.bgOpacity && overlay.bgOpacity > 0
                                      ? hexToRgba(overlay.bgColor ?? '#000000', overlay.bgOpacity)
                                      : 'repeating-linear-gradient(45deg,#e5e7eb 0,#e5e7eb 4px,#f9fafb 4px,#f9fafb 8px)',
                                  }}
                                  className="inline-block rounded"
                                >
                                  {overlay.text || 'Text mẫu'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className={`relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  !banner && !croppedBlob && !preview
                    ? 'border-red-300 hover:border-red-400'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
                style={{ aspectRatio: selectedAspect.value.replace(':', '/'), containerType: 'inline-size' }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" className="h-full w-full object-cover" />
                    
                    {/* Text overlays preview — fontSize in cqw so it scales with container */}
                    {textOverlays.map((overlay) => {
                      const hasBg = overlay.bgColor && (overlay.bgOpacity ?? 0) > 0
                      return (
                        <div
                          key={overlay.id}
                          style={{
                            position: 'absolute',
                            left: `${overlay.position.x}%`,
                            top: `${overlay.position.y}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${overlay.fontSize / 10}cqw`,
                            color: overlay.color,
                            fontWeight: overlay.fontWeight,
                            fontStyle: overlay.italic ? 'italic' : 'normal',
                            letterSpacing: overlay.letterSpacing ? `${overlay.letterSpacing}px` : undefined,
                            textShadow: !hasBg ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            backgroundColor: hasBg ? hexToRgba(overlay.bgColor!, overlay.bgOpacity!) : 'transparent',
                            border: (overlay.borderWidth ?? 0) > 0 ? `${overlay.borderWidth}px solid ${overlay.borderColor ?? '#ffffff'}` : 'none',
                            borderRadius: overlay.borderRadius ? `${overlay.borderRadius}px` : undefined,
                            paddingLeft: `${overlay.paddingX ?? (hasBg ? 12 : 0)}px`,
                            paddingRight: `${overlay.paddingX ?? (hasBg ? 12 : 0)}px`,
                            paddingTop: `${overlay.paddingY ?? (hasBg ? 6 : 0)}px`,
                            paddingBottom: `${overlay.paddingY ?? (hasBg ? 6 : 0)}px`,
                          }}
                        >
                          {overlay.text}
                        </div>
                      )
                    })}
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                      <div className="hidden group-hover:flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700">
                        <Upload size={12} /> Đổi ảnh
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white">
                      <Upload size={10} /> Click để đổi ảnh
                    </div>
                    {/* Button preview on image */}
                    {form.button_text && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: `${buttonStyle.position.x}%`,
                          top: `${buttonStyle.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span
                          className="inline-flex items-center gap-1.5 shadow-lg"
                          style={{
                            color: buttonStyle.textColor,
                            backgroundColor: hexToRgba(buttonStyle.bgColor, buttonStyle.bgOpacity),
                            border: buttonStyle.borderWidth > 0 ? `${buttonStyle.borderWidth}px solid ${buttonStyle.borderColor}` : 'none',
                            borderRadius: `${buttonStyle.borderRadius}px`,
                            paddingLeft: `${buttonStyle.paddingX}em`,
                            paddingRight: `${buttonStyle.paddingX}em`,
                            paddingTop: `${buttonStyle.paddingY}em`,
                            paddingBottom: `${buttonStyle.paddingY}em`,
                            fontSize: `${buttonStyle.fontSize / 10}cqw`,
                            fontWeight: buttonStyle.fontWeight,
                          }}
                        >
                          {buttonStyle.showIcon && <ShoppingCart style={{ width: '1em', height: '1em' }} />}
                          {form.button_text}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <Upload size={28} />
                    <p className="text-sm font-medium">Click để tải ảnh lên</p>
                    <p className="text-xs">Tỉ lệ: {selectedAspect.label}</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              {croppedBlob && (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <Check size={11} /> Ảnh đã được cắt theo tỉ lệ {selectedAspect.label}
                </p>
              )}
            </div>

            {/* Title - Hidden vì đã có text overlay */}
            {/* <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Tiêu đề banner (không bắt buộc)"
              />
            </div> */}

            {/* Subtitle - Hidden vì đã có text overlay */}
            {/* <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phụ đề</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Mô tả ngắn"
              />
            </div> */}

            {/* Link + Button */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Link URL</label>
                <input
                  value={form.link_url}
                  onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="/products"
                />
              </div>

              {/* Button section — collapsible */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                {/* Button header */}
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setBtnCollapsed(p => !p)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {btnCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                    <span className="text-xs font-semibold text-gray-700">Nút CTA (Call-to-action)</span>
                    {form.button_text && (
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">{form.button_text}</span>
                    )}
                  </button>
                </div>

                {/* Button body */}
                {!btnCollapsed && (
                  <div className="p-3 space-y-3">
                    {/* Text nút */}
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-500">Text nút (để trống = ẩn nút)</label>
                      <input
                        value={form.button_text}
                        onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Mua luôn"
                      />
                    </div>

                    {form.button_text && (
                      <>
                        {/* Vị trí */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Vị trí X (%)</label>
                            <input
                              type="number"
                              value={buttonStyle.position.x}
                              onChange={(e) => setButtonStyle(p => ({ ...p, position: { ...p.position, x: Number(e.target.value) } }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="0" max="100"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Vị trí Y (%)</label>
                            <input
                              type="number"
                              value={buttonStyle.position.y}
                              onChange={(e) => setButtonStyle(p => ({ ...p, position: { ...p.position, y: Number(e.target.value) } }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="0" max="100"
                            />
                          </div>
                        </div>

                        {/* Màu sắc */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Màu chữ</label>
                            <input
                              type="color"
                              value={buttonStyle.textColor}
                              onChange={(e) => setButtonStyle(p => ({ ...p, textColor: e.target.value }))}
                              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Màu nền nút</label>
                            <input
                              type="color"
                              value={buttonStyle.bgColor}
                              onChange={(e) => setButtonStyle(p => ({ ...p, bgColor: e.target.value }))}
                              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Độ mờ nền */}
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-gray-500">
                            Độ mờ nền: <span className="text-indigo-600">{Math.round(buttonStyle.bgOpacity * 100)}%</span>
                          </label>
                          <input
                            type="range" min="0" max="1" step="0.05"
                            value={buttonStyle.bgOpacity}
                            onChange={(e) => setButtonStyle(p => ({ ...p, bgOpacity: Number(e.target.value) }))}
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        {/* Border */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Màu viền</label>
                            <input
                              type="color"
                              value={buttonStyle.borderColor}
                              onChange={(e) => setButtonStyle(p => ({ ...p, borderColor: e.target.value }))}
                              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Độ dày viền (px)</label>
                            <input
                              type="number"
                              value={buttonStyle.borderWidth}
                              onChange={(e) => setButtonStyle(p => ({ ...p, borderWidth: Number(e.target.value) }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="0" max="10"
                            />
                          </div>
                        </div>

                        {/* Bo góc + Font size */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Bo góc (px)</label>
                            <input
                              type="number"
                              value={buttonStyle.borderRadius}
                              onChange={(e) => setButtonStyle(p => ({ ...p, borderRadius: Number(e.target.value) }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="0" max="999"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Cỡ chữ (% rộng)</label>
                            <input
                              type="number"
                              value={buttonStyle.fontSize}
                              onChange={(e) => setButtonStyle(p => ({ ...p, fontSize: Number(e.target.value) }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="5" max="80" step="1"
                            />
                          </div>
                        </div>

                        {/* Padding + Font weight */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Padding ngang (em)</label>
                            <input
                              type="number"
                              value={buttonStyle.paddingX}
                              onChange={(e) => setButtonStyle(p => ({ ...p, paddingX: Number(e.target.value) }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="0" max="5" step="0.1"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Padding dọc (em)</label>
                            <input
                              type="number"
                              value={buttonStyle.paddingY}
                              onChange={(e) => setButtonStyle(p => ({ ...p, paddingY: Number(e.target.value) }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              min="0" max="3" step="0.1"
                            />
                          </div>
                        </div>

                        {/* Font weight + Icon */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Độ đậm</label>
                            <select
                              value={buttonStyle.fontWeight}
                              onChange={(e) => setButtonStyle(p => ({ ...p, fontWeight: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="900">Extra Bold</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-500">Icon giỏ hàng</label>
                            <button
                              type="button"
                              onClick={() => setButtonStyle(p => ({ ...p, showIcon: !p.showIcon }))}
                              className={`w-full rounded border px-2 py-1 text-sm font-medium transition-colors ${
                                buttonStyle.showIcon
                                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                  : 'border-gray-300 text-gray-500 hover:border-gray-400'
                              }`}
                            >
                              {buttonStyle.showIcon ? '🛒 Hiện' : '🚫 Ẩn'}
                            </button>
                          </div>
                        </div>

                        {/* Live preview */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">Xem trước:</span>
                          {/* Container query wrapper — simulates banner width so cqw scales correctly */}
                          <div style={{ containerType: 'inline-size', width: 300 }}>
                            <span
                              className="inline-flex items-center gap-1.5"
                              style={{
                                color: buttonStyle.textColor,
                                backgroundColor: hexToRgba(buttonStyle.bgColor, buttonStyle.bgOpacity),
                                border: buttonStyle.borderWidth > 0 ? `${buttonStyle.borderWidth}px solid ${buttonStyle.borderColor}` : 'none',
                                borderRadius: `${buttonStyle.borderRadius}px`,
                                paddingLeft: `${buttonStyle.paddingX}em`,
                                paddingRight: `${buttonStyle.paddingX}em`,
                                paddingTop: `${buttonStyle.paddingY}em`,
                                paddingBottom: `${buttonStyle.paddingY}em`,
                                fontSize: `${buttonStyle.fontSize / 10}cqw`,
                                fontWeight: buttonStyle.fontWeight,
                                background: buttonStyle.bgOpacity > 0
                                  ? hexToRgba(buttonStyle.bgColor, buttonStyle.bgOpacity)
                                  : 'repeating-linear-gradient(45deg,#e5e7eb 0,#e5e7eb 4px,#f9fafb 4px,#f9fafb 8px)',
                              }}
                            >
                              {buttonStyle.showIcon && <ShoppingCart style={{ width: '1em', height: '1em' }} />}
                              {form.button_text}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {form.is_active ? 'Hiển thị banner' : 'Ẩn banner'}
              </span>
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={(!banner && !croppedBlob && !imageUrl.trim()) || mutation.isPending}
                title={!banner && !croppedBlob && !imageUrl.trim() ? 'Vui lòng chọn ảnh hoặc nhập URL' : ''}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? 'Đang lưu...' : banner ? 'Cập nhật' : 'Tạo banner'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop modal — z-index cao hơn */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspect={selectedAspect.ratio}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  const aspect = banner.aspect_ratio ?? '16:5'
  let textOverlays: Array<{
    id: string; text: string; fontSize: number; color: string;
    position: { x: number; y: number }; fontWeight: string; animation?: string;
    bgColor?: string; bgOpacity?: number; borderColor?: string; borderWidth?: number;
    borderRadius?: number; paddingX?: number; paddingY?: number; italic?: boolean; letterSpacing?: number;
  }> = []
  try { textOverlays = banner.text_overlays ? JSON.parse(banner.text_overlays) : [] } catch { /* empty */ }

  const defaultBtnStyle = {
    position: { x: 50, y: 85 },
    bgColor: '#ffffff', bgOpacity: 0.15,
    textColor: '#ffffff', borderColor: '#ffffff', borderWidth: 2,
    borderRadius: 999, paddingX: 1.6, paddingY: 0.7,
    fontSize: 20, fontWeight: 'bold', showIcon: true,
  }
  let btnStyle = defaultBtnStyle
  try {
    if (banner.button_style) {
      const parsed = { ...defaultBtnStyle, ...JSON.parse(banner.button_style) }
      // Migrate old px values (> 5) to em
      if (parsed.paddingX > 5) parsed.paddingX = Math.round((parsed.paddingX / 14) * 10) / 10
      if (parsed.paddingY > 5) parsed.paddingY = Math.round((parsed.paddingY / 14) * 10) / 10
      // Migrate old px fontSize (> 10) to cqw units (value/10 = cqw, same as text overlays)
      if (parsed.fontSize > 10) parsed.fontSize = Math.round(parsed.fontSize * 1.5)
      btnStyle = parsed
    }
  } catch { /* empty */ }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Banner preview */}
        <div
          className="relative overflow-hidden bg-gray-900"
          style={{ aspectRatio: aspect.replace(':', '/'), containerType: 'inline-size' }}
        >
          {banner.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon size={48} className="text-gray-600" />
            </div>
          )}
          {/* Text overlays — fontSize in cqw so it scales with container */}
          {textOverlays.map((overlay) => {
            const hasBg = overlay.bgColor && (overlay.bgOpacity ?? 0) > 0
            return (
              <div
                key={overlay.id}
                style={{
                  position: 'absolute',
                  left: `${overlay.position.x}%`,
                  top: `${overlay.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${overlay.fontSize / 10}cqw`,
                  color: overlay.color,
                  fontWeight: overlay.fontWeight,
                  fontStyle: overlay.italic ? 'italic' : 'normal',
                  letterSpacing: overlay.letterSpacing ? `${overlay.letterSpacing}px` : undefined,
                  textShadow: !hasBg ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  backgroundColor: hasBg ? hexToRgba(overlay.bgColor!, overlay.bgOpacity!) : 'transparent',
                  border: (overlay.borderWidth ?? 0) > 0 ? `${overlay.borderWidth}px solid ${overlay.borderColor ?? '#ffffff'}` : 'none',
                  borderRadius: overlay.borderRadius ? `${overlay.borderRadius}px` : undefined,
                  paddingLeft: `${overlay.paddingX ?? (hasBg ? 12 : 0)}px`,
                  paddingRight: `${overlay.paddingX ?? (hasBg ? 12 : 0)}px`,
                  paddingTop: `${overlay.paddingY ?? (hasBg ? 6 : 0)}px`,
                  paddingBottom: `${overlay.paddingY ?? (hasBg ? 6 : 0)}px`,
                }}
              >
                {overlay.text}
              </div>
            )
          })}
          {/* CTA button preview */}
          {banner.button_text && (
            <div
              className="absolute z-[2]"
              style={{
                left: `${btnStyle.position.x}%`,
                top: `${btnStyle.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className="inline-flex items-center gap-2 shadow-lg"
                style={{
                  color: btnStyle.textColor,
                  backgroundColor: hexToRgba(btnStyle.bgColor, btnStyle.bgOpacity),
                  border: btnStyle.borderWidth > 0 ? `${btnStyle.borderWidth}px solid ${btnStyle.borderColor}` : 'none',
                  borderRadius: `${btnStyle.borderRadius}px`,
                  paddingLeft: `${btnStyle.paddingX}em`,
                  paddingRight: `${btnStyle.paddingX}em`,
                  paddingTop: `${btnStyle.paddingY}em`,
                  paddingBottom: `${btnStyle.paddingY}em`,
                  fontSize: `${btnStyle.fontSize / 10}cqw`,
                  fontWeight: btnStyle.fontWeight,
                }}
              >
                {btnStyle.showIcon && <ShoppingCart style={{ width: '1em', height: '1em' }} />}
                {banner.button_text}
              </span>
            </div>
          )}
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-between bg-gray-900 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">{banner.title}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
              {aspect}
            </span>
          </div>
          {banner.link_url && (
            <a
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink size={12} /> {banner.link_url}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  loading,
}: {
  checked: boolean
  onChange: () => void
  loading?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ─── Aspect ratio badge color ──────────────────────────────────────────────────
function AspectBadge({ ratio }: { ratio: string }) {
  const colors: Record<string, string> = {
    '16:9': 'bg-blue-100 text-blue-700',
    '16:5': 'bg-purple-100 text-purple-700',
    '21:9': 'bg-orange-100 text-orange-700',
  }
  const cls = colors[ratio] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {ratio}
    </span>
  )
}

export default function BannersPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; banner?: Banner }>({ open: false })
  const [preview, setPreview] = useState<Banner | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get<{ data: Banner[] }>('/api/admin/banners').then((r) => r.data.data ?? []),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.put(`/api/admin/banners/${id}`, { is_active: active ? 1 : 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
      setTogglingId(null)
    },
    onError: () => setTogglingId(null),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/banners/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  })

  const banners = data ?? []

  // Stats
  const activeCount = banners.filter((b) => b.is_active).length
  const inactiveCount = banners.length - activeCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Banner</h1>
          <p className="mt-0.5 text-sm text-gray-500">Banner hiển thị trên trang chủ frontend</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Thêm banner
        </button>
      </div>

      {/* Stats bar */}
      {banners.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
            <span className="text-xs font-medium text-gray-600">Tổng:</span>
            <span className="text-xs font-bold text-gray-900">{banners.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-700">Đang hiện: {activeCount}</span>
          </div>
          {inactiveCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="text-xs font-medium text-gray-500">Đang ẩn: {inactiveCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-40 animate-pulse bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">Chưa có banner nào</p>
          <p className="mt-1 text-sm text-gray-400">Tạo banner đầu tiên để hiển thị trên trang chủ</p>
          <button
            onClick={() => setModal({ open: true })}
            className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Tạo banner đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {banners.map((banner) => {
            const aspect = banner.aspect_ratio ?? '16:5'
            const isToggling = togglingId === banner.id

            return (
              <div
                key={banner.id}
                className={`group overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
                  banner.is_active ? 'border-gray-200' : 'border-gray-200 opacity-70'
                }`}
              >
                {/* Image area — correct aspect ratio */}
                <div
                  className="relative overflow-hidden bg-gray-100"
                  style={{ aspectRatio: aspect.replace(':', '/') }}
                >
                  {banner.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon size={32} className="text-gray-300" />
                    </div>
                  )}

                  {/* Inactive overlay */}
                  {!banner.is_active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700">
                        <EyeOff size={11} /> Đang ẩn
                      </span>
                    </div>
                  )}

                  {/* Hover: quick preview button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                    <button
                      onClick={() => setPreview(banner)}
                      className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-gray-800 shadow-lg hover:bg-white transition-colors"
                    >
                      <Eye size={13} /> Xem banner
                    </button>
                  </div>
                </div>

                {/* Card footer */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                        <AspectBadge ratio={aspect} />
                      </div>
                      {banner.subtitle && (
                        <p className="mt-0.5 text-xs text-gray-500 truncate">{banner.subtitle}</p>
                      )}
                      {banner.link_url && (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs text-indigo-600 hover:underline truncate"
                        >
                          <ExternalLink size={10} /> {banner.link_url}
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Toggle switch */}
                      <div className="flex items-center gap-1.5">
                        <ToggleSwitch
                          checked={banner.is_active}
                          loading={isToggling}
                          onChange={() => {
                            setTogglingId(banner.id)
                            toggleMutation.mutate({ id: banner.id, active: !banner.is_active })
                          }}
                        />
                      </div>

                      {/* Divider */}
                      <div className="h-5 w-px bg-gray-200" />

                      {/* View */}
                      <button
                        onClick={() => setPreview(banner)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title="Xem banner"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setModal({ open: true, banner })}
                        className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Xóa banner "${banner.title}"?`)) {
                            deleteMutation.mutate(banner.id)
                          }
                        }}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                        title="Xóa banner"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {modal.open && <BannerModal banner={modal.banner} onClose={() => setModal({ open: false })} />}
      {preview && <PreviewModal banner={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
