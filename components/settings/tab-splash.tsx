'use client'
import { useState } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Monitor, Sparkles, Eye } from 'lucide-react'

interface Props {
  values: Record<string, string>
  setValues: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
}

const EFFECTS = [
  {
    value: 'particles',
    label: 'Particles',
    desc: 'Các chấm nhỏ nổi lên xuống',
    icon: '✦',
    preview: 'bg-gradient-to-br from-indigo-50 to-white',
  },
  {
    value: 'ripple',
    label: 'Ripple',
    desc: 'Sóng lan ra từ logo',
    icon: '◎',
    preview: 'bg-gradient-to-br from-blue-50 to-white',
  },
  {
    value: 'aurora',
    label: 'Aurora',
    desc: 'Ánh sáng cực quang',
    icon: '◈',
    preview: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50',
  },
  {
    value: 'matrix',
    label: 'Matrix',
    desc: 'Ký tự rơi xuống',
    icon: '⌗',
    preview: 'bg-gradient-to-br from-green-50 to-white',
  },
  {
    value: 'bubbles',
    label: 'Bubbles',
    desc: 'Bong bóng nổi lên',
    icon: '○',
    preview: 'bg-gradient-to-br from-sky-50 to-white',
  },
  {
    value: 'wave',
    label: 'Wave',
    desc: 'Sóng chạy ngang',
    icon: '∿',
    preview: 'bg-gradient-to-br from-teal-50 to-white',
  },
  {
    value: 'glitch',
    label: 'Glitch',
    desc: 'Hiệu ứng nhiễu kỹ thuật số',
    icon: '▣',
    preview: 'bg-gradient-to-br from-red-50 to-white',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    desc: 'Đơn giản, không hiệu ứng',
    icon: '—',
    preview: 'bg-white',
  },
]

const BG_STYLES = [
  { value: 'gradient', label: 'Gradient nhẹ', desc: 'Nền gradient màu chủ đạo' },
  { value: 'white',    label: 'Trắng tinh',   desc: 'Nền trắng thuần' },
  { value: 'dark',     label: 'Tối',          desc: 'Nền tối sang trọng' },
  { value: 'blur',     label: 'Blur glass',   desc: 'Kính mờ hiện đại' },
]

// Mini preview component
function SplashPreview({
  effect,
  bgStyle,
  tagline,
  primaryColor,
}: {
  effect: string
  bgStyle: string
  tagline: string
  primaryColor: string
}) {
  const isDark = bgStyle === 'dark'
  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subColor  = isDark ? '#94a3b8' : '#64748b'

  const bgMap: Record<string, string> = {
    gradient: `radial-gradient(ellipse 80% 60% at 30% 30%, ${primaryColor}18 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 70% 70%, ${primaryColor}10 0%, transparent 60%), #fff`,
    white:    '#ffffff',
    dark:     'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    blur:     `linear-gradient(135deg, ${primaryColor}12 0%, #f8fafc 50%, ${primaryColor}08 100%)`,
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-gray-200 shadow-inner"
      style={{ height: 220, background: bgMap[bgStyle] || bgMap.gradient }}
    >
      {/* Effect preview overlay */}
      {effect === 'particles' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
                background: primaryColor,
                opacity: 0.35 + (i % 3) * 0.1,
                top: `${8 + i * 9}%`,
                left: `${5 + i * 9}%`,
                animation: `pvFloat ${2.5 + i * 0.4}s ${i * 0.25}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      )}
      {effect === 'aurora' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full"
            style={{
              width: 260, height: 180,
              top: '-20%', left: '-10%',
              background: `radial-gradient(ellipse, ${primaryColor}40, transparent 70%)`,
              filter: 'blur(40px)',
              animation: 'pvAurora1 5s ease-in-out infinite alternate',
            }} />
          <div className="absolute rounded-full"
            style={{
              width: 200, height: 160,
              bottom: '-15%', right: '-5%',
              background: 'radial-gradient(ellipse, #818cf840, transparent 70%)',
              filter: 'blur(35px)',
              animation: 'pvAurora2 6s 1s ease-in-out infinite alternate',
            }} />
          <div className="absolute rounded-full"
            style={{
              width: 150, height: 120,
              top: '20%', right: '15%',
              background: `radial-gradient(ellipse, ${primaryColor}25, transparent 70%)`,
              filter: 'blur(30px)',
              animation: 'pvAurora1 4s 2s ease-in-out infinite alternate',
            }} />
        </div>
      )}
      {effect === 'matrix' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="absolute font-mono"
              style={{
                color: primaryColor,
                fontSize: 10,
                opacity: 0.3,
                left: `${6 + i * 13}%`,
                top: '-20px',
                lineHeight: '1.6',
                whiteSpace: 'pre',
                animation: `pvMatrix ${2.5 + i * 0.5}s ${i * 0.4}s linear infinite`,
              }}>
              {['01\n10\n11', '10\n01\n00', '11\n00\n10', '00\n11\n01', '01\n10\n11', '10\n01\n00', '11\n00\n10'][i]}
            </div>
          ))}
        </div>
      )}
      {effect === 'bubbles' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="absolute rounded-full border"
              style={{
                width: 10 + i * 7, height: 10 + i * 7,
                borderColor: primaryColor,
                opacity: 0.3,
                bottom: `-${10 + i * 7}px`,
                left: `${8 + i * 13}%`,
                animation: `pvBubble ${3 + i * 0.6}s ${i * 0.5}s ease-in infinite`,
              }} />
          ))}
        </div>
      )}
      {effect === 'wave' && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: 60 }}>
          <svg viewBox="0 0 400 50" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
            <path fill={primaryColor} fillOpacity="0.18">
              <animate attributeName="d" dur="3s" repeatCount="indefinite" values="
                M0,25 C80,5 160,45 240,25 C320,5 370,35 400,25 L400,50 L0,50 Z;
                M0,15 C80,40 160,5 240,30 C320,50 370,10 400,20 L400,50 L0,50 Z;
                M0,25 C80,5 160,45 240,25 C320,5 370,35 400,25 L400,50 L0,50 Z" />
            </path>
            <path fill={primaryColor} fillOpacity="0.09">
              <animate attributeName="d" dur="5s" repeatCount="indefinite" values="
                M0,35 C100,15 200,50 300,30 C360,18 390,40 400,35 L400,50 L0,50 Z;
                M0,40 C100,55 200,20 300,45 C360,55 390,25 400,40 L400,50 L0,50 Z;
                M0,35 C100,15 200,50 300,30 C360,18 390,40 400,35 L400,50 L0,50 Z" />
            </path>
          </svg>
        </div>
      )}
      {effect === 'ripple' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0,1,2,3].map(i => (
            <div key={i} className="absolute rounded-full border"
              style={{
                width: 50 + i * 35, height: 50 + i * 35,
                borderColor: primaryColor,
                opacity: 0,
                animation: `pvRipple 3s ${i * 0.75}s ease-out infinite`,
              }} />
          ))}
        </div>
      )}
      {effect === 'glitch' && (
        <div className="absolute inset-0 pointer-events-none">
          {[0,1,2].map(i => (
            <div key={i} className="absolute left-0 right-0"
              style={{
                height: 2,
                background: `linear-gradient(90deg, transparent, ${primaryColor}60, transparent)`,
                top: `${25 + i * 25}%`,
                animation: `pvGlitchScan ${1.8 + i * 0.6}s ${i * 0.4}s ease-in-out infinite`,
              }} />
          ))}
          {[0,1].map(i => (
            <div key={i} className="absolute"
              style={{
                height: 3,
                background: primaryColor,
                opacity: 0,
                width: `${25 + i * 20}%`,
                left: `${10 + i * 30}%`,
                top: `${20 + i * 40}%`,
                animation: `pvGlitchBlock ${0.9 + i * 0.3}s ${i * 0.5}s steps(1) infinite`,
              }} />
          ))}
        </div>
      )}

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-black shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
          D
        </div>
        <p className="text-sm font-black" style={{ color: textColor }}>DT Shop</p>
        <p className="text-xs" style={{ color: subColor }}>{tagline || 'Mua sắm trực tuyến dễ dàng'}</p>
        <div className="mt-1 h-0.5 w-16 overflow-hidden rounded-full" style={{ background: '#e2e8f0' }}>
          <div className="h-full w-2/3 rounded-full" style={{ background: primaryColor }} />
        </div>
      </div>

      <style>{`
        @keyframes pvFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50%       { transform: translateY(-12px) scale(1.4); opacity: 0.7; }
        }
        @keyframes pvAurora1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.2); }
        }
        @keyframes pvAurora2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-25px, -15px) scale(1.15); }
        }
        @keyframes pvMatrix {
          from { transform: translateY(-100%); opacity: 0.35; }
          to   { transform: translateY(280px); opacity: 0; }
        }
        @keyframes pvBubble {
          0%   { transform: translateY(0) scale(1); opacity: 0.35; }
          80%  { opacity: 0.15; }
          100% { transform: translateY(-240px) scale(0.6); opacity: 0; }
        }
        @keyframes pvRipple {
          0%   { transform: scale(0.3); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pvGlitchScan {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(6px); opacity: 0.15; }
        }
        @keyframes pvGlitchBlock {
          0%, 88%, 100% { opacity: 0; transform: translateX(0); }
          90%            { opacity: 0.7; transform: translateX(-6px); }
          94%            { opacity: 0.4; transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

export function TabSplash({ values, setValues }: Props) {
  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }))
  const [showPreview, setShowPreview] = useState(true)

  const effect     = values.splash_effect    || 'particles'
  const bgStyle    = values.splash_bg_style  || 'gradient'
  const tagline    = values.splash_tagline   || 'Mua sắm trực tuyến dễ dàng'
  const enabled    = values.splash_enabled   !== '0'
  const primaryColor = values.primary_color  || '#6366f1'

  return (
    <div className="space-y-8">

      {/* Enable toggle */}
      <section>
        <h3 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Monitor size={15} /> Màn hình chờ (Splash Screen)
        </h3>
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Bật màn hình chờ</p>
            <p className="text-xs text-gray-500 mt-0.5">Hiển thị khi người dùng lần đầu vào website</p>
          </div>
          <Toggle
            checked={enabled}
            onChange={v => set('splash_enabled', v ? '1' : '0')}
          />
        </div>
      </section>

      {enabled && (
        <>
          {/* Tagline */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-sm font-semibold text-gray-800">Nội dung</h3>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => set('splash_tagline', e.target.value)}
                placeholder="Mua sắm trực tuyến dễ dàng"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">Dòng chữ nhỏ hiển thị dưới tên shop</p>
            </div>
          </section>

          {/* Background style */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-sm font-semibold text-gray-800">Kiểu nền</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BG_STYLES.map(bg => (
                <button
                  key={bg.value}
                  onClick={() => set('splash_bg_style', bg.value)}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                    bgStyle === bg.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Mini bg preview */}
                  <div className={`h-8 w-full rounded-lg ${
                    bg.value === 'dark'     ? 'bg-slate-800' :
                    bg.value === 'white'    ? 'bg-white border border-gray-200' :
                    bg.value === 'blur'     ? 'bg-gradient-to-br from-indigo-100 to-white' :
                    'bg-gradient-to-br from-indigo-50 to-white'
                  }`} />
                  <p className={`text-xs font-semibold ${bgStyle === bg.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {bg.label}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight">{bg.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Effect picker */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles size={14} /> Hiệu ứng động
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EFFECTS.map(fx => (
                <button
                  key={fx.value}
                  onClick={() => set('splash_effect', fx.value)}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all ${
                    effect === fx.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`flex h-9 w-full items-center justify-center rounded-lg text-xl ${fx.preview}`}
                    style={{ color: primaryColor }}>
                    {fx.icon}
                  </div>
                  <p className={`text-xs font-semibold ${effect === fx.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {fx.label}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight">{fx.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Live preview */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Eye size={14} /> Xem trước
              </h3>
              <button
                onClick={() => setShowPreview(p => !p)}
                className="text-xs text-indigo-600 hover:underline"
              >
                {showPreview ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {showPreview && (
              <SplashPreview
                effect={effect}
                bgStyle={bgStyle}
                tagline={tagline}
                primaryColor={primaryColor}
              />
            )}
            <p className="mt-2 text-xs text-gray-400">
              * Preview dùng màu chính từ tab Giao diện. Logo thật sẽ hiển thị khi vào website.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
