'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Category } from '@/types'

// ─── Build tree from flat list ────────────────────────────────────────────────
export function buildTree(flat: Category[]): Category[] {
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

// ─── Single tree node ─────────────────────────────────────────────────────────
interface TreeNodeProps {
  category: Category & { children?: Category[] }
  depth: number
  onDelete: (id: number, name: string) => void
  deleting: number | null
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetId: number) => void
  draggingId: number | null
}

function TreeNode({ category, depth, onDelete, deleting, onDragStart, onDragOver, onDrop, draggingId }: TreeNodeProps) {
  const children = (category.children ?? []) as (Category & { children?: Category[] })[]
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = useState(depth === 0)
  const isDragging = draggingId === category.id

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, category.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, category.id)}
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
          isDragging ? 'opacity-40' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {/* Drag handle */}
        <span className="flex h-5 w-5 shrink-0 cursor-grab items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 active:cursor-grabbing">
          <GripVertical size={12} />
        </span>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition-colors ${hasChildren ? 'hover:text-gray-700' : 'cursor-default opacity-0'}`}
        >
          {hasChildren && (expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </button>

        {/* Icon */}
        <span className="text-gray-400 shrink-0">
          {hasChildren
            ? (expanded ? <FolderOpen size={14} className="text-indigo-400" /> : <Folder size={14} className="text-indigo-400" />)
            : <Folder size={14} className="text-gray-300" />
          }
        </span>

        {/* Name */}
        <span className="flex-1 min-w-0 truncate text-sm text-gray-800 font-medium">{category.name}</span>

        {/* Slug */}
        <span className="hidden sm:block text-[11px] font-mono text-gray-400 mr-2">{category.slug}</span>

        {/* Children count badge */}
        {hasChildren && (
          <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500 mr-1">
            {children.length}
          </span>
        )}

        {/* Actions — show on hover */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <Link
            href={`/dashboard/categories/${category.id}/edit`}
            className="rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="Sửa"
          >
            <Pencil size={12} />
          </Link>
          <button
            onClick={() => onDelete(category.id, category.name)}
            disabled={deleting === category.id}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
            title="Xóa"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              onDelete={onDelete}
              deleting={deleting}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              draggingId={draggingId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main CategoryTree ────────────────────────────────────────────────────────
interface CategoryTreeProps {
  categories: Category[]
  isLoading?: boolean
  isError?: boolean
}

export function CategoryTree({ categories, isLoading, isError }: CategoryTreeProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  const reorderMutation = useMutation({
    mutationFn: ({ id, newParentId, position }: { id: number; newParentId: number | null; position: number }) =>
      api.put(`/api/categories/${id}/reorder`, { parent_id: newParentId, position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  const handleDelete = useCallback((id: number, name: string) => {
    if (!confirm(`Xóa danh mục "${name}"?\nCác danh mục con sẽ trở thành danh mục gốc.`)) return
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      return
    }

    // Find target category to get its parent
    const target = categories.find((c) => c.id === targetId)
    if (!target) {
      setDraggingId(null)
      return
    }

    // Move dragged item to be sibling of target (same parent)
    reorderMutation.mutate({
      id: draggingId,
      newParentId: target.parent?.id ?? null,
      position: 0, // Backend should handle position calculation
    })

    setDraggingId(null)
  }

  // Filter flat list by search, then rebuild tree
  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase()))
    : categories

  const tree = buildTree(filtered) as (Category & { children?: Category[] })[]

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100" style={{ marginLeft: `${(i % 3) * 20}px` }} />
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="px-4 py-8 text-center text-sm text-red-500">Không thể tải danh mục</div>
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm danh mục..."
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">
            Xóa bộ lọc
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{categories.length} danh mục</span>
      </div>

      {/* Tree */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Folder size={32} className="mb-2 opacity-30" />
            <p className="text-sm">{search ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}</p>
            {!search && (
              <Link href="/dashboard/categories/new" className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                <Plus size={12} /> Tạo danh mục đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="py-1">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                category={node}
                depth={0}
                onDelete={handleDelete}
                deleting={deleteMutation.isPending ? (deleteMutation.variables as number) : null}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggingId={draggingId}
              />
            ))}
          </div>
        )}
      </div>
      
      {draggingId && (
        <p className="text-xs text-indigo-600">
          💡 Kéo thả danh mục lên danh mục khác để thay đổi thứ tự hoặc chuyển cấp
        </p>
      )}
    </div>
  )
}
