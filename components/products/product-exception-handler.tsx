'use client'

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useState } from 'react'

export type AlertType = 'error' | 'warning' | 'info' | 'success'

export interface Alert {
  id: string
  type: AlertType
  title: string
  message: string
  details?: string[]
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface ProductExceptionHandlerProps {
  alerts: Alert[]
  onDismiss: (id: string) => void
}

const iconMap: Record<AlertType, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const colorMap: Record<AlertType, { bg: string; border: string; icon: string; title: string; text: string }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-900',
    text: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-900',
    text: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    text: 'text-blue-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    title: 'text-green-900',
    text: 'text-green-700',
  },
}

function AlertItem({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const Icon = iconMap[alert.type]
  const colors = colorMap[alert.type]

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex gap-3">
        <Icon size={18} className={`mt-0.5 shrink-0 ${colors.icon}`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${colors.title}`}>{alert.title}</h3>
          <p className={`mt-0.5 text-sm ${colors.text}`}>{alert.message}</p>
          
          {alert.details && alert.details.length > 0 && (
            <ul className={`mt-2 space-y-1 text-xs ${colors.text}`}>
              {alert.details.map((detail, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}

          {alert.action && (
            <button
              onClick={alert.action.onClick}
              className={`mt-3 inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                alert.type === 'error'
                  ? 'bg-red-100 hover:bg-red-200 text-red-700'
                  : alert.type === 'warning'
                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                    : alert.type === 'info'
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
              }`}
            >
              {alert.action.label}
            </button>
          )}
        </div>

        {alert.dismissible !== false && (
          <button
            onClick={onDismiss}
            className={`shrink-0 rounded p-1 transition-colors ${
              alert.type === 'error'
                ? 'hover:bg-red-100 text-red-400'
                : alert.type === 'warning'
                  ? 'hover:bg-yellow-100 text-yellow-400'
                  : alert.type === 'info'
                    ? 'hover:bg-blue-100 text-blue-400'
                    : 'hover:bg-green-100 text-green-400'
            }`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export function ProductExceptionHandler({ alerts, onDismiss }: ProductExceptionHandlerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onDismiss={() => onDismiss(alert.id)} />
      ))}
    </div>
  )
}

/**
 * Hook for managing alerts
 */
export function useProductAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const addAlert = (alert: Omit<Alert, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setAlerts((prev) => [...prev, { ...alert, id }])
    return id
  }

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  const addError = (title: string, message: string, details?: string[]) => {
    return addAlert({ type: 'error', title, message, details, dismissible: true })
  }

  const addWarning = (title: string, message: string, details?: string[]) => {
    return addAlert({ type: 'warning', title, message, details, dismissible: true })
  }

  const addInfo = (title: string, message: string) => {
    return addAlert({ type: 'info', title, message, dismissible: true })
  }

  const addSuccess = (title: string, message: string) => {
    const id = addAlert({ type: 'success', title, message, dismissible: true })
    setTimeout(() => removeAlert(id), 3000)
    return id
  }

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    addError,
    addWarning,
    addInfo,
    addSuccess,
  }
}
