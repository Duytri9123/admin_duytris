'use client'

interface Setting { key: string; value: string | null; type: string; label: string }

interface Props {
  settings: Setting[]
  values: Record<string, string>
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function TabSeo({ settings, values, setValues }: Props) {
  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }))

  return (
    <div className="space-y-5">
      {settings.map(s => (
        <div key={s.key}>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{s.label}</label>
          {s.key === 'meta_description' ? (
            <textarea
              value={values[s.key] ?? ''}
              onChange={e => set(s.key, e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              placeholder={s.label}
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
          {/* Character count for meta fields */}
          {(s.key === 'meta_title' || s.key === 'meta_description') && (
            <p className={`mt-1 text-right text-xs ${
              s.key === 'meta_title' && (values[s.key]?.length ?? 0) > 60 ? 'text-red-500' :
              s.key === 'meta_description' && (values[s.key]?.length ?? 0) > 160 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {values[s.key]?.length ?? 0} / {s.key === 'meta_title' ? 60 : 160}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
