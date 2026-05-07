'use client'

import { useAdminPushNotifications } from '@/hooks/use-push-notifications'

export function PushNotificationsInit() {
  useAdminPushNotifications()
  return null
}
