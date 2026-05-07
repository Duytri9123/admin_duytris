'use client'

import { useState, useCallback, useRef } from 'react'
import { Search, X, ChevronRight, Trash2, Pencil, Plus, Folder, AlertCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Category } from '@/types'

// ─── CSRF cache — chỉ fetch 1 lần per session ────────────────────────────────
let _csrfReady = false
async function ensureCsrf() {
  if (_csrfReady) return
  await apiClient.get('/sanctum/csrf-cookie')
  _csrfReady = true
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type CategoryNode = Category & { children?: CategoryNode[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flattenTree(nodes: CategoryNode[], ancestors: CategoryNode[] = []): { node: CategoryNode; ancestors: CategoryNode[] }[] {
  if (!Array.isArray(nodes)) return []
  return nodes.flatMap((n) => [
    { node: n, ancestors },
    ...flattenTree(n.children ?? [], [...ancestors, n]),
  ])
}

// Flatten thành select options với ký tự cây ├─ └─ và disabled theo maxDepth
function flattenForSelect(
  nodes: CategoryNode[],
  maxDepth: number,
  depth = 0,
  isLast: boolean[] = []
): { id: number; label: string; disabled: boolean }[] {
  if (!Array.isArray(nodes)) return []
  return nodes.flatMap((n, idx) => {
    const last = idx === nodes.length - 1
    const prefix = depth === 0
      ? ''
      : isLast.slice(1).map((l) => (l ? '\u00a0\u00a0\u00a0\u00a0' : '\u2502\u00a0\u00a0\u00a0')).join('') +
        (last ? '\u2514\u2500 ' : '\u251C\u2500 ')
    return [
      { id: n.id, label: prefix + n.name, disabled: depth >= maxDepth - 1 },
      ...flattenForSelect(n.children ?? [], maxDepth, depth + 1, [...isLast, last]),
    ]
  })
}

function getAncestors(nodes: CategoryNode[], targetId: number, path: CategoryNode[] = []): CategoryNode[] | null {
  for (const n of nodes) {
    if (n.id === targetId) return path
    const found = getAncestors(n.children ?? [], targetId, [...path, n])
    if (found) return found
  }
  return null
}

function findNode(nodes: CategoryNode[], id: number): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findNode(n.children ?? [], id)
    if (found) return found
  }
  return null
}

function insertChild(nodes: CategoryNode[], parentId: number, child: CategoryNode): CategoryNode[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children ?? []), child] }
      : { ...n, children: insertChild(n.children ?? [], parentId, child) }
  )
}

function removeNode(nodes: CategoryNode[], id: number): CategoryNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children ?? [], id) }))
}

// ─── Tree Node ────────────────────────────────────────────────────────────────
interface TreeNodeProps {
  node: CategoryNode
  depth: number
  selectedId: number | null
  onSelect: (id: number) => void
  onDelete: (id: number, name: string) => void
  onEdit?: (id: number) => void
  deleting: number | null
  isTemp?: boolean
}

function TreeNode({ node, depth, selectedId, onSelect, onDelete, onEdit, deleting, isTemp }: TreeNodeProps) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = useState(depth < 2)
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        onClick={() => !isTemp && onSelect(node.id)}
        className={[
          'group flex items-center gap-1.5 rounded-lg px-2 min-h-[44px] select-none transition-colors',
          isTemp ? 'opacity-50 cursor-default' : 'cursor-pointer',
          isSelected ? 'bg-blue-50' : isTemp ? '' : 'hover:bg-gray-50',
        ].join(' ')}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {/* Chevron */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p) }}
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-400 transition-colors',
            hasChildren ? 'hover:text-gray-700' : 'opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <ChevronRight size={13} className={`transition-transform duration-150 ${expanded && hasChildren ? 'rotate-90' : ''}`} />
        </button>

        <Folder size={15} className={`shrink-0 ${isTemp ? 'text-gray-300 animate-pulse' : hasChildren ? 'text-indigo-400' : 'text-gray-300'}`} />

        <span className={`flex-1 min-w-0 truncate text-sm font-medium ${isSelected ? 'text-blue-700' : isTemp ? 'text-gray-400 italic' : 'text-gray-800'}`}>
          {node.name}
        </span>

        {!isTemp && <span className="hidden sm:block text-[11px] font-mono text-gray-400 mr-1">{node.slug}</span>}

        {hasChildren && !isTemp && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 mr-0.5">
            {children.length}
          </span>
        )}

        {!isTemp && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit?.(node.id)}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Sửa"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(node.id, node.name)}
              disabled={deleting === node.id}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Xóa"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-5 border-l border-gray-200 pl-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onEdit={onEdit}
              deleting={deleting}
              isTemp={(child.id as number) < 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface CategoryTreeDraggableProps {
  categories: CategoryNode[]
  isLoading?: boolean
  isError?: boolean
  onEdit?: (id: number) => void
  maxDepth?: number
}

export function CategoryTreeDraggable({ categories, isLoading, isError, onEdit, maxDepth = 3 }: CategoryTreeDraggableProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const newNameRef = useRef<HTMLInputElement>(null)

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf()
      return apiClient.delete(`/api/categories/${id}`)
    },
    onMutate: async (id) => {
      setDeleteError(null)
      await queryClient.cancelQueries({ queryKey: ['admin-categories'] })
      const prev = queryClient.getQueryData<CategoryNode[]>(['admin-categories'])
      queryClient.setQueryData<CategoryNode[]>(['admin-categories'], (old = []) => removeNode(old, id))
      if (selectedId === id) setSelectedId(null)
      return { prev }
    },
    onError: (err, _id, ctx) => {
      // Rollback
      if (ctx?.prev) queryClient.setQueryData(['admin-categories'], ctx.prev)
      // Hiển thị lỗi từ backend (có sản phẩm / có danh mục con)
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(msg ?? 'Không thể xóa danh mục này')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
  })

  // ── Create ──────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; parent_id?: number }) => {
      await ensureCsrf()
      const res = await apiClient.post<{ data: CategoryNode }>('/api/categories', payload)
      return res.data.data
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['admin-categories'] })
      const prev = queryClient.getQueryData<CategoryNode[]>(['admin-categories'])
      const tempNode: CategoryNode = { id: -Date.now(), name: payload.name, slug: '', parent_id: payload.parent_id ?? null, children: [] }
      queryClient.setQueryData<CategoryNode[]>(['admin-categories'], (old = []) =>
        payload.parent_id ? insertChild(old, payload.parent_id, tempNode) : [...old, tempNode]
      )
      setNewName('')
      return { prev, tempId: tempNode.id }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['admin-categories'], ctx.prev)
    },
    onSuccess: (realNode, payload, ctx) => {
      // Thay node tạm bằng node thật ngay lập tức — không cần chờ refetch
      queryClient.setQueryData<CategoryNode[]>(['admin-categories'], (old = []) => {
        function replaceTemp(nodes: CategoryNode[]): CategoryNode[] {
          return nodes.map((n) =>
            n.id === ctx?.tempId
              ? { ...realNode, children: n.children ?? [] }
              : { ...n, children: replaceTemp(n.children ?? []) }
          )
        }
        return replaceTemp(old)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      newNameRef.current?.focus()
    },
  })

  const handleDelete = useCallback((id: number, name: string) => {
    setDeleteError(null)
    if (!confirm(`Xóa danh mục "${name}"?\n\nLưu ý: không thể xóa nếu còn danh mục con hoặc sản phẩm.`)) return
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) { newNameRef.current?.focus(); return }
    createMutation.mutate({ name, parent_id: parentId ? Number(parentId) : undefined })
  }

  const q = search.trim().toLowerCase()
  const safeCategories = Array.isArray(categories) ? categories : []
  const allNodes = flattenTree(safeCategories)
  const searchResults = q ? allNodes.filter(({ node }) => node.name.toLowerCase().includes(q)) : []
  const selectedNode = selectedId !== null ? findNode(safeCategories, selectedId) : null
  const ancestors = selectedId !== null ? getAncestors(safeCategories, selectedId) ?? [] : []
  const selectOptions = flattenForSelect(safeCategories.filter((n) => (n.id as number) > 0), maxDepth)
  const selectedParentDisabled = parentId !== '' && selectOptions.find((o) => o.id === Number(parentId))?.disabled
  const totalCount = allNodes.filter((x) => (x.node.id as number) > 0).length

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" style={{ marginLeft: `${(i % 3) * 20}px` }} />
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-500">Không thể tải danh mục</div>
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Danh mục</span>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
          {selectedNode ? '1 đã chọn' : `${totalCount} danh mục`}
        </span>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative border-b border-gray-100 px-3 py-2.5">
        <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm danh mục..."
          className="w-full h-10 rounded-lg border border-gray-300 bg-gray-50 pl-8 pr-9 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-6 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Tree / Search results */}
      <div className="min-h-[120px] max-h-[480px] overflow-y-auto">
        {q ? (
          <div className="p-1.5">
            {searchResults.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400">Không tìm thấy danh mục nào</p>
            ) : (
              searchResults.map(({ node, ancestors: ancs }) => {
                const isSelected = selectedId === node.id
                const pathText = ancs.map((a) => a.name).join(' › ')
                const idx = node.name.toLowerCase().indexOf(q)
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedId(isSelected ? null : node.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 min-h-[44px] cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <Folder size={14} className="shrink-0 text-indigo-400" />
                    <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                      {node.name.slice(0, idx)}
                      <strong className="text-blue-600">{node.name.slice(idx, idx + q.length)}</strong>
                      {node.name.slice(idx + q.length)}
                    </span>
                    {pathText && <span className="text-[11px] text-gray-400 truncate max-w-[40%]">{pathText}</span>}
                  </div>
                )
              })
            )}
          </div>
        ) : safeCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Folder size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="p-1.5">
            {safeCategories.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                onDelete={handleDelete}
                onEdit={onEdit}
                deleting={deleteMutation.isPending ? (deleteMutation.variables as number) : null}
                isTemp={(node.id as number) < 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="border-t border-gray-100 px-3 py-2.5 min-h-[52px] flex items-center">
        {!selectedNode ? (
          <span className="text-sm text-gray-400">Chưa có danh mục nào được chọn</span>
        ) : (
          <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
              {ancestors.map((a) => (
                <span key={a.id} className="flex items-center gap-1">
                  <span className="text-xs text-blue-400">{a.name}</span>
                  <ChevronRight size={10} className="text-blue-300" />
                </span>
              ))}
              <span className="text-sm font-semibold text-blue-700">{selectedNode.name}</span>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Quick add form */}
      <div className="border-t border-gray-100 bg-gray-50 px-3 py-2.5 space-y-2">
        {selectedParentDisabled && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <AlertCircle size={13} className="shrink-0" />
            Danh mục này đã đạt cấp tối đa ({maxDepth} cấp), không thể thêm con
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-10 flex-1 min-w-[130px] rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A8A7A3' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              paddingRight: '28px',
              appearance: 'none',
            }}
          >
            <option value="">— Danh mục gốc (cấp 1) —</option>
            {selectOptions.map((o) => (
              <option key={o.id} value={o.id} disabled={o.disabled}>
                {o.label}{o.disabled ? ' (đã đủ cấp)' : ''}
              </option>
            ))}
          </select>
          <input
            ref={newNameRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !selectedParentDisabled && handleAdd()}
            placeholder="Tên danh mục mới..."
            maxLength={60}
            disabled={!!selectedParentDisabled}
            className="h-10 flex-[2] min-w-[140px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleAdd}
            disabled={createMutation.isPending || !!selectedParentDisabled}
            title={selectedParentDisabled ? `Tối đa ${MAX_DEPTH} cấp danh mục` : ''}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Plus size={14} />
            {createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400">Cây danh mục tối đa {maxDepth} cấp</p>
      </div>
    </div>
  )
}
