'use client'

interface Setting { key: string; value: string | null; type: string; label: string }

interface Props {
  settings: Setting[]
  values: Record<string, string>
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

const SOCIAL_ICONS: Record<string, string> = {
  facebook_url:  '🔵',
  instagram_url: '🟣',
  youtube_url:   '🔴',
  tiktok_url:    '⚫',
}

export function TabSocial({ settings, values, setValues }: Props) {
  return (
    <div className="space-y-5">
      {settings.map(s => (
        <div key={s.key}>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
            <span>{SOCIAL_ICONS[s.key] ?? '🌐'}</span>
            {s.label}
          </label>
          <input
            type="url"
            value={values[s.key] ?? ''}
            onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={`https://...`}
          />
        </div>
      ))}
    </div>
  )
}
