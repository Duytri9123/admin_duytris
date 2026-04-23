'use client'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { ToastType } from '@/hooks/use-toast'

const config: Record<ToastType, { icon: React.ElementType; bg: string; text: string }> = {
  success: { icon: CheckCircle,   bg: 'bg-emerald-500', text: 'text-white' },
  error:   { icon: XCircle,       bg: 'bg-red-500',     text: 'text-white' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500',   text: 'text-white' },
  info:    { icon: Info,          bg: 'bg-blue-500',    text: 'text-white' },
}

interface ToastItemProps {
  id: string
  message: string
  type: ToastType
  onDismiss: (id: string) => void
}

export function ToastItem({ id, message, type, onDismiss }: ToastItemProps) {
  const { icon: Icon, bg, text } = config[type]
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${bg} ${text} min-w-[280px] max-w-sm animate-in slide-in-from-right-5`}>
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={() => onDismiss(id)} className="shrink-0 opacity-80 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: { id: string; message: string; type: ToastType }[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
