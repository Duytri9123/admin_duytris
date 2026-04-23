'use client'
import { useRef, useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'

const THEMES = [
  { value: 'dark',  label: 'Tối (Dark)',   preview: 'bg-slate-900' },
  { value: 'light', label: 'Sáng (Light)', preview: 'bg-gray-100 border border-gray-300' },
]

const ACCENT_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#22c55e', label: 'Green' },
]

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function resolveUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('http')) return url
  return `${API}${url}`
}

interface Props {
  values: Record<string, string>
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  uploading?: string | null
  onUpload?: (key: string, file: File) => void
}

export function TabAdmin({ values, setValues, uploading, onUpload }: Props) {
  const logoRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }))
  const accent = values.admin_accent_color || '#6366f1'

  const handleLogoChange = (file: File) => {
    const blob = URL.createObjectURL(file)
    setPreviewUrl(blob)
    onUpload?.('admin_logo_url', file)
  }

  const displayLogoUrl = previewUrl || resolveUrl(values.admin_logo_url)

  return (
    <div className="space-y-8">

      {/* Branding */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Thương hiệu Admin</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên hiển thị trên sidebar</label>
            <input type="text" value={values.admin_site_name ?? ''} onChange={e => set('admin_site_name', e.target.value)}
              placeholder="Admin Panel"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <p className="mt-1 text-xs text-gray-400">Để trống sẽ dùng tên website chung</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Logo Admin (sidebar)</label>
            <div className="flex items-start gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => logoRef.current?.click()}
              >
                {displayLogoUrl ? (
                  <>
                    <img src={displayLogoUrl} alt="logo" className="h-full w-full object-contain p-1"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    {uploading === 'admin_logo_url' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Loader2 size={16} className="animate-spin text-indigo-600" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Upload size={16} />
                    <span className="text-[10px]">Logo</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleLogoChange(e.target.files[0])} />
                <button onClick={() => logoRef.current?.click()} disabled={uploading === 'admin_logo_url'}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60 transition-colors">
                  {uploading === 'admin_logo_url' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  Tải lên logo
                </button>
                {displayLogoUrl && (
                  <button onClick={() => { set('admin_logo_url', ''); setPreviewUrl('') }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                    <X size={12} /> Xóa logo
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Click vào ô ảnh để chọn file. Để trống sẽ dùng logo website chung.</p>
          </div>
        </div>
      </section>

      {/* Preview sidebar */}
      <section>
        <h3 className="mb-3 border-b pb-2 text-sm font-semibold text-gray-800">Xem trước Sidebar</h3>
        <div className={`w-52 rounded-xl overflow-hidden shadow-lg border ${values.admin_sidebar_theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <div className={`flex items-center gap-2.5 px-3 py-3 border-b ${values.admin_sidebar_theme === 'light' ? 'border-gray-200' : 'border-slate-700/60'}`}>
            {displayLogoUrl
              ? <img src={displayLogoUrl} alt="logo" className="h-6 w-6 rounded object-contain" />
              : <div className="flex h-6 w-6 items-center justify-center rounded-md text-white text-xs font-bold shrink-0" style={{ backgroundColor: accent }}>
                  {(values.admin_site_name || values.site_name || 'A')[0]?.toUpperCase()}
                </div>
            }
            <span className={`text-xs font-bold truncate ${values.admin_sidebar_theme === 'light' ? 'text-gray-800' : 'text-slate-100'}`}>
              {values.admin_site_name || values.site_name || 'Admin Panel'}
            </span>
          </div>
          {[{ label: 'Dashboard', active: true }, { label: 'Sản phẩm', active: false }, { label: 'Đơn hàng', active: false }, { label: 'Cài đặt', active: false }].map(({ label, active }) => (
            <div key={label}
              className={`flex items-center gap-2 mx-2 my-0.5 px-2 py-1.5 rounded-md text-xs ${active ? 'text-white' : values.admin_sidebar_theme === 'light' ? 'text-gray-500' : 'text-slate-400'}`}
              style={active ? { backgroundColor: accent } : undefined}>
              <span className="h-3 w-3 rounded-sm bg-current opacity-60 shrink-0" />
              {label}
            </div>
          ))}
          <div className={`flex items-center gap-2 border-t px-3 py-2.5 mt-1 ${values.admin_sidebar_theme === 'light' ? 'border-gray-200' : 'border-slate-700/60'}`}>
            <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: accent }}>A</div>
            <div className="min-w-0">
              <p className={`text-[11px] font-medium truncate ${values.admin_sidebar_theme === 'light' ? 'text-gray-800' : 'text-slate-200'}`}>Admin</p>
              <p className={`text-[10px] truncate ${values.admin_sidebar_theme === 'light' ? 'text-gray-400' : 'text-slate-500'}`}>admin@dtshop.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Giao diện Sidebar</h3>
        <div className="flex flex-wrap gap-3">
          {THEMES.map(t => (
            <button key={t.value} onClick={() => set('admin_sidebar_theme', t.value)}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm transition-all ${(values.admin_sidebar_theme || 'dark') === t.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <span className={`h-4 w-4 rounded ${t.preview}`} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Accent color */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Màu nhấn Admin</h3>
        <div className="flex flex-wrap items-center gap-2.5">
          {ACCENT_COLORS.map(c => (
            <button key={c.value} onClick={() => set('admin_accent_color', c.value)} title={c.label}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${accent === c.value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c.value }}>
              {accent === c.value && <span className="text-white text-xs font-bold">✓</span>}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-1">
            <input type="color" value={accent} onChange={e => set('admin_accent_color', e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-full border-2 border-gray-300 p-0.5" />
            <span className="text-xs text-gray-500 font-mono">{accent}</span>
          </div>
        </div>
      </section>

      {/* Layout options */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Tùy chọn layout</h3>
        <div className="space-y-4">
          <Toggle checked={values.admin_sidebar_collapsed === '1'} onChange={v => set('admin_sidebar_collapsed', v ? '1' : '0')} label="Sidebar thu gọn mặc định" />
          <Toggle checked={values.admin_compact_mode === '1'}      onChange={v => set('admin_compact_mode', v ? '1' : '0')}      label="Chế độ compact" />
          <Toggle checked={values.admin_show_breadcrumb !== '0'}   onChange={v => set('admin_show_breadcrumb', v ? '1' : '0')}   label="Hiển thị breadcrumb" />
        </div>
      </section>

      {/* Per page */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Phân trang</h3>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Số dòng mỗi trang</label>
          <select value={values.admin_per_page || '15'} onChange={e => set('admin_per_page', e.target.value)}
            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
            {['10', '15', '20', '25', '50'].map(n => <option key={n} value={n}>{n} dòng</option>)}
          </select>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h3 className="mb-4 border-b border-red-200 pb-2 text-sm font-semibold text-red-600">Vùng nguy hiểm</h3>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Xóa cache hệ thống</p>
              <p className="text-xs text-gray-500">Xóa toàn bộ cache để tải lại dữ liệu mới nhất</p>
            </div>
            <button className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              Xóa cache
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
