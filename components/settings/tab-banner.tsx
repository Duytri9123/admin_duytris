'use client'
import { Toggle } from '@/components/ui/toggle'

interface Setting { key: string; value: string | null; type: string; label: string }

interface Props {
  settings: Setting[]
  values: Record<string, string>
  setValues: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
}

export function TabBanner({ settings, values, setValues }: Props) {
  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Cấu hình Carousel</h3>
        <div className="space-y-4">
          {/* Auto slide interval */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Thời gian tự động chuyển (ms)
            </label>
            <input
              type="number"
              value={values['banner_autoplay_interval'] ?? '5000'}
              onChange={e => set('banner_autoplay_interval', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="5000"
              min="1000"
              max="30000"
              step="1000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Thời gian giữa các banner (1000ms = 1 giây). Đề xuất: 5000ms
            </p>
          </div>

          {/* Show arrows */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Hiển thị nút điều hướng (mũi tên)
            </label>
            <Toggle
              checked={values['banner_show_arrows'] === '1'}
              onChange={v => set('banner_show_arrows', v ? '1' : '0')}
              label={values['banner_show_arrows'] === '1' ? 'Hiển thị' : 'Ẩn'}
            />
          </div>

          {/* Show dots */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Hiển thị chấm chỉ báo (dots)
            </label>
            <Toggle
              checked={values['banner_show_dots'] === '1'}
              onChange={v => set('banner_show_dots', v ? '1' : '0')}
              label={values['banner_show_dots'] === '1' ? 'Hiển thị' : 'Ẩn'}
            />
          </div>

          {/* Transition effect */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Hiệu ứng chuyển cảnh
            </label>
            <select
              value={values['banner_transition'] ?? 'fade'}
              onChange={e => set('banner_transition', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="fade">Fade (Mờ dần)</option>
              <option value="slide">Slide (Trượt ngang)</option>
              <option value="zoom">Zoom (Phóng to)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
