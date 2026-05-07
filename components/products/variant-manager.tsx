'use client'

import { useState, useCallback } from 'react'
import type { ProductVariant } from '@/types'

interface VariantManagerProps {
  variants: Partial<ProductVariant>[]
  onChange: (variants: Partial<ProductVariant>[]) => void
}

// ─── Preset attribute names ───────────────────────────────────────────────────
const DEFAULT_PRESETS = ['Màu sắc', 'Kích cỡ', 'Chất liệu', 'Kiểu dáng']
const STORAGE_KEY = 'variant_custom_attrs'

function loadCustomAttrs(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveCustomAttrs(list: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

interface AttrRow {
  id: string
  name: string
  valuesRaw: string
}

function uid() { return Math.random().toString(36).slice(2) }

function parseValues(raw: string): string[] {
  return raw.split(',').map((v) => v.trim()).filter(Boolean)
}

function buildVariantsFromAttrs(attrs: AttrRow[]): Partial<ProductVariant>[] {
  const filled = attrs.filter((a) => a.name.trim() && parseValues(a.valuesRaw).length > 0)
  if (!filled.length) return []
  const groups = filled.map((a) => parseValues(a.valuesRaw))
  let combos: string[][] = [[]]
  for (const g of groups) combos = combos.flatMap((c) => g.map((v) => [...c, v]))
  return combos.map((combo, i) => ({
    sku: '',
    selling_price: 0,
    original_price: 0,
    quantity: 0,
    is_default: i === 0,
    // store combo label in dimensions field as a workaround
    dimensions: combo.join(' / '),
  }))
}

// ─── Simple variant row (no attributes) ──────────────────────────────────────
function SimpleVariantRow({
  variant,
  index,
  onUpdate,
  onRemove,
}: {
  variant: Partial<ProductVariant>
  index: number
  onUpdate: (field: keyof ProductVariant, value: string | number | boolean) => void
  onRemove: () => void
}) {
  const inp = 'w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {variant.dimensions ? variant.dimensions : `Biến thể #${index + 1}`}
        </span>
        <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:text-red-700">Xóa</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { key: 'sku', label: 'SKU', type: 'text', placeholder: 'SP-001' },
          { key: 'selling_price', label: 'Giá bán', type: 'number', placeholder: '' },
          { key: 'original_price', label: 'Giá gốc', type: 'number', placeholder: '' },
          { key: 'quantity', label: 'Số lượng', type: 'number', placeholder: '' },
        ] as const).map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
            <input
              type={type}
              min={type === 'number' ? 0 : undefined}
              value={(variant[key as keyof ProductVariant] as string | number) ?? ''}
              onChange={(e) => onUpdate(key as keyof ProductVariant, type === 'number' ? Number(e.target.value) : e.target.value)}
              placeholder={placeholder}
              className={inp}
            />
          </div>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={variant.is_default ?? false}
          onChange={(e) => onUpdate('is_default', e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Biến thể mặc định
      </label>
    </div>
  )
}

// ─── Main VariantManager ──────────────────────────────────────────────────────
export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const [useAttributes, setUseAttributes] = useState(false)
  const [attrs, setAttrs] = useState<AttrRow[]>([{ id: uid(), name: '', valuesRaw: '' }])
  const [customPresets, setCustomPresets] = useState<string[]>(() => loadCustomAttrs())
  const [newPresetName, setNewPresetName] = useState('')
  const [generated, setGenerated] = useState(false)

  const presets = [
    ...DEFAULT_PRESETS,
    ...customPresets.filter((c) => !DEFAULT_PRESETS.map((d) => d.toLowerCase()).includes(c.toLowerCase())),
  ]

  const addAttr = () => setAttrs((p) => [...p, { id: uid(), name: '', valuesRaw: '' }])
  const removeAttr = (id: string) => { setAttrs((p) => p.filter((a) => a.id !== id)); setGenerated(false) }
  const updateAttr = (id: string, patch: Partial<AttrRow>) => { setAttrs((p) => p.map((a) => a.id === id ? { ...a, ...patch } : a)); setGenerated(false) }

  const addCustomPreset = () => {
    const n = newPresetName.trim()
    if (!n || presets.map((p) => p.toLowerCase()).includes(n.toLowerCase())) return
    const next = [...customPresets, n]
    setCustomPresets(next)
    saveCustomAttrs(next)
    setNewPresetName('')
  }

  const generateCombos = () => {
    const filled = attrs.filter((a) => a.name.trim() && parseValues(a.valuesRaw).length > 0)
    if (!filled.length) return
    const names = filled.map((a) => a.name.toLowerCase())
    if (new Set(names).size !== names.length) return // duplicate names
    const built = buildVariantsFromAttrs(filled)
    onChange(built)
    setGenerated(true)
  }

  const addManual = () => onChange([...variants, { sku: '', selling_price: 0, original_price: 0, quantity: 0, is_default: false }])
  const removeVariant = (index: number) => onChange(variants.filter((_, i) => i !== index))
  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  const hasValidAttr = attrs.some((a) => a.name.trim() && parseValues(a.valuesRaw).length > 0)
  const hasDupAttr = (() => {
    const names = attrs.filter((a) => a.name.trim()).map((a) => a.name.toLowerCase())
    return new Set(names).size !== names.length
  })()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Biến thể sản phẩm</h3>
        {/* Toggle attribute mode */}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
          <div
            onClick={() => { setUseAttributes((p) => !p); setGenerated(false) }}
            className={`relative h-5 w-9 rounded-full transition-colors ${useAttributes ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${useAttributes ? 'left-4' : 'left-0.5'}`} />
          </div>
          Dùng thuộc tính
        </label>
      </div>

      {/* ── Attribute mode ── */}
      {useAttributes && (
        <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
          <p className="text-xs text-gray-500">Nhập thuộc tính và giá trị, sau đó bấm <strong>Sinh tổ hợp</strong> để tạo biến thể tự động.</p>

          {attrs.map((attr) => {
            const otherNames = attrs.filter((a) => a.id !== attr.id).map((a) => a.name.toLowerCase())
            const isDup = attr.name.trim() !== '' && otherNames.includes(attr.name.toLowerCase())
            return (
              <div key={attr.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Thuộc tính</label>
                  <select
                    value={attr.name}
                    onChange={(e) => updateAttr(attr.id, { name: e.target.value })}
                    className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isDup ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">-- Chọn --</option>
                    {presets.filter((p) => !otherNames.includes(p.toLowerCase()) || attr.name.toLowerCase() === p.toLowerCase()).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {isDup && <p className="mt-0.5 text-[10px] text-red-500">Trùng tên!</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Giá trị (cách nhau bởi dấu phẩy)</label>
                  <input
                    type="text"
                    value={attr.valuesRaw}
                    onChange={(e) => updateAttr(attr.id, { valuesRaw: e.target.value })}
                    placeholder="S, M, L, XL"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {attrs.length > 1 && (
                  <button type="button" onClick={() => removeAttr(attr.id)} className="mb-0.5 text-xs text-red-500 hover:text-red-700 pb-1.5">✕</button>
                )}
              </div>
            )
          })}

          {/* Add custom preset */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPreset())}
              placeholder="Thêm thuộc tính mới..."
              className="flex-1 rounded-lg border border-dashed border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomPreset}
              disabled={!newPresetName.trim()}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Lưu
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {attrs.length < 3 && (
              <button
                type="button"
                onClick={addAttr}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                + Thêm thuộc tính
              </button>
            )}
            <button
              type="button"
              onClick={generateCombos}
              disabled={!hasValidAttr || hasDupAttr}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${generated ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {generated ? `✓ Đã sinh ${variants.length} tổ hợp` : 'Sinh tổ hợp →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Variant list ── */}
      {variants.length === 0 && !useAttributes && (
        <p className="text-sm italic text-gray-400">Chưa có biến thể nào.</p>
      )}

      {variants.map((variant, index) => (
        <SimpleVariantRow
          key={index}
          variant={variant}
          index={index}
          onUpdate={(field, value) => updateVariant(index, field, value)}
          onRemove={() => removeVariant(index)}
        />
      ))}

      {/* Add manual variant (only when not using attribute mode) */}
      {!useAttributes && (
        <button
          type="button"
          onClick={addManual}
          className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-100 w-full"
        >
          + Thêm biến thể thủ công
        </button>
      )}
    </div>
  )
}
