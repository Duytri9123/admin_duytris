'use client'
import { Toggle } from '@/components/ui/toggle'

interface Setting { key: string; value: string | null; type: string; label: string }

interface Props {
  settings: Setting[]
  values: Record<string, string>
  setValues: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
}

export function TabGeneral({ settings, values, setValues }: Props) {
  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }))

  return (
    <div className="space-y-5">
      {settings.map(s => (
        <div key={s.key}>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{s.label}</label>
          {s.type === 'boolean' ? (
            <Toggle
              checked={values[s.key] === '1'}
              onChange={v => set(s.key, v ? '1' : '0')}
              label={values[s.key] === '1' ? 'Bật' : 'Tắt'}
            />
          ) : (
            <input
              type="text"
              value={values[s.key] ?? ''}
              onChange={e => set(s.key, e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={s.label}
            />
          )}
        </div>
      ))}
    </div>
  )
}
