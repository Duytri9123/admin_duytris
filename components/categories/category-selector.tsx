'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check, Folder } from 'lucide-react'
import type { Category } from '@/types'

// ─── Build tree from flat list ────────────────────────────────────────────────
function buildTree(flat: Category[]): (Category & { children: Category[] })[] {
  const map = new Map<number, Category & { children: Category[] }>()
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }))
  const roots: (Category & { children: Category[] })[] = []
  map.forEach((node) => {
    if (node.parent?.id && map.has(node.parent.id)) {
      map.get(node.parent.id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

// ─── Find node by ID ──────────────────────────────────────────────────────────
function findNode(nodes: (Category & { children?: Category[] })[], id: number): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

// ─── Build path from root to selected node ────────────────────────────────────
function buildPath(tree: (Category & { children?: Category[] })[], targetId: number): number[] {
  const path: number[] = []
  let currentId: number | undefined = targetId
  
  while (currentId) {
    const node = findNode(tree, currentId)
    if (node) {
      path.unshift(node.id)
      currentId = node.parent?.id
    } else {
      break
    }
  }
  return path
}

// ─── Level dropdown ───────────────────────────────────────────────────────────
function LevelDropdown({ 
  title, 
  nodes, 
  activeId, 
  onSelect 
}: { 
  title: string
  nodes: (Category & { children?: Category[] })[]
  activeId?: number
  onSelect: (id: number) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</label>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-1.5 space-y-1">
        {nodes.length === 0 ? (
          <div className="p-3 text-xs italic text-gray-400">Trống</div>
        ) : (
          nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeId === node.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder size={13} className={activeId === node.id ? 'text-white' : 'text-indigo-400'} />
                {node.name}
              </span>
              {activeId === node.id && <Check size={14} />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface CategorySelectorProps {
  categories: Category[]
  selectedId?: number | null
  onSelect: (id: number) => void
}

export function CategorySelector({ categories, selectedId, onSelect }: CategorySelectorProps) {
  const [path, setPath] = useState<number[]>([])
  const tree = buildTree(categories)

  // Initialize path when selectedId changes
  useEffect(() => {
    if (selectedId && categories.length > 0) {
      const newPath = buildPath(tree, selectedId)
      setPath(newPath)
    } else {
      setPath([])
    }
  }, [selectedId, categories])

  const level1Nodes = tree
  const level2Nodes = path[0] ? tree.find((n) => n.id === path[0])?.children || [] : []
  const level3Nodes = path[1] ? level2Nodes.find((n) => n.id === path[1])?.children || [] : []

  const handleSelect = (levelIndex: number, nodeId: number) => {
    const newPath = [...path.slice(0, levelIndex), nodeId]
    setPath(newPath)
    onSelect(nodeId)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500">
        Cấp 1 là bắt buộc. Bạn có thể dừng ở cấp 1 hoặc chọn thêm cấp 2, cấp 3 nếu cần.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LevelDropdown
          title="Cấp 1 (chính)"
          nodes={level1Nodes}
          activeId={path[0]}
          onSelect={(id) => handleSelect(0, id)}
        />
        <LevelDropdown
          title="Cấp 2 (phụ)"
          nodes={level2Nodes}
          activeId={path[1]}
          onSelect={(id) => handleSelect(1, id)}
        />
        <LevelDropdown
          title="Cấp 3 (chi tiết)"
          nodes={level3Nodes}
          activeId={path[2]}
          onSelect={(id) => handleSelect(2, id)}
        />
      </div>
      
      {/* Selected path breadcrumb */}
      {path.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs">
          <span className="font-semibold text-indigo-600">Đã chọn:</span>
          {path.map((id, i) => {
            const node = findNode(tree, id)
            return (
              <span key={id} className="flex items-center gap-1.5">
                {i > 0 && <ChevronDown size={10} className="rotate-[-90deg] text-indigo-400" />}
                <span className="font-medium text-indigo-700">{node?.name}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
