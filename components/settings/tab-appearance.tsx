'use client'
import { useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'

const FONTS = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito', 'Poppins']
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function resolveUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
  return `${API}/${url.replace(/^\//, '')}`
}

interface Props {
  values: Record<string, string>
  setValues: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
  uploading: string | null
  onUpload: (key: 'logo_url' | 'favicon_url', file: File) => void
}

export function TabAppearance({ values, setValues, uploading, onUpload }: Props) {
  const logoRef    = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)
  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }))

  return (
    <div className="space-y-8">
      {/* Logo & Favicon */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Logo & Favicon</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            { key: 'logo_url' as const, label: 'Logo', ref: logoRef },
            { key: 'favicon_url' as const, label: 'Favicon', ref: faviconRef },
          ]).map(({ key, label, ref }) => (
            <div key={key}>
              <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-5 hover:border-indigo-400 transition-colors">
                {values[key] && values[key].trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveUrl(values[key])}
                    alt={label}
                    className="h-16 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="flex h-16 w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                    Chưa có {label.toLowerCase()}
                  </div>
                )}
                <input ref={ref} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && onUpload(key, e.target.files[0])} />
                <button
                  onClick={() => ref.current?.click()}
                  disabled={uploading === key}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60"
                >
                  {uploading === key ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  Tải lên
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Bảng màu</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { key: 'primary_color',   label: 'Màu chính',  default: '#6366f1' },
            { key: 'secondary_color', label: 'Màu phụ',    default: '#f59e0b' },
            { key: 'accent_color',    label: 'Màu nhấn',   default: '#10b981' },
          ].map(({ key, label, default: def }) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 p-2">
                <input type="color" value={values[key] || def}
                  onChange={e => set(key, e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border-0 p-0" />
                <input type="text" value={values[key] || ''}
                  onChange={e => set(key, e.target.value)}
                  className="flex-1 font-mono text-sm focus:outline-none" placeholder="#000000" />
              </div>
              <div className="mt-2 h-7 rounded-md transition-colors" style={{ backgroundColor: values[key] || def }} />
            </div>
          ))}
        </div>
      </section>

      {/* Font & Banner */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Font & Banner</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Font chữ</label>
            <select value={values.font_family || 'Inter'} onChange={e => set('font_family', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <p className="mt-2 text-sm text-gray-500" style={{ fontFamily: values.font_family || 'Inter' }}>
              Preview: Chữ mẫu — The quick brown fox
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nội dung banner</label>
            <input type="text" value={values.banner_text || ''} onChange={e => set('banner_text', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <Toggle checked={values.banner_enabled === '1'} onChange={v => set('banner_enabled', v ? '1' : '0')} label="Hiển thị banner" />
        </div>
      </section>

      {/* Preview */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800">Xem trước</h3>
        <div className="overflow-hidden rounded-xl border">
          {values.banner_enabled === '1' && (
            <div className="px-4 py-2 text-center text-xs text-white" style={{ backgroundColor: values.primary_color || '#6366f1' }}>
              {values.banner_text || 'Banner thông báo'}
            </div>
          )}
          <div className="flex items-center gap-4 border-b bg-white px-5 py-3">
            <span className="text-base font-bold" style={{ color: values.primary_color || '#6366f1', fontFamily: values.font_family || 'Inter' }}>
              {values.site_name || 'DT Shop'}
            </span>
            <div className="ml-auto flex gap-3 text-xs text-gray-600" style={{ fontFamily: values.font_family || 'Inter' }}>
              {['Trang chủ', 'Sản phẩm', 'Giỏ hàng'].map(i => <span key={i}>{i}</span>)}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 bg-gray-50 p-5">
            {[
              { label: 'Nút chính', key: 'primary_color', def: '#6366f1' },
              { label: 'Nút phụ',   key: 'secondary_color', def: '#f59e0b' },
              { label: 'Nút nhấn',  key: 'accent_color', def: '#10b981' },
            ].map(({ label, key, def }) => (
              <button key={key} className="rounded-lg px-4 py-2 text-xs text-white" style={{ backgroundColor: values[key] || def }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
