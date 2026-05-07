'use client'

import { useEffect, useRef } from 'react'

const BEAMS_INSTANCE_ID = '4363638b-37cc-4fdb-99bb-9b20c8d4865a'

export function useAdminPushNotifications() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current || typeof window === 'undefined') return

    const script = document.createElement('script')
    script.src = 'https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js'
    script.async = true
    script.onload = async () => {
      try {
        const PPN = (window as any).PusherPushNotifications
        if (!PPN) return

        const beamsClient = new PPN.Client({ instanceId: BEAMS_INSTANCE_ID })
        await beamsClient.start()

        // Admin subscribes to all admin interests
        await Promise.all([
          beamsClient.addDeviceInterest('hello'),
          beamsClient.addDeviceInterest('admin-all'),
          beamsClient.addDeviceInterest('admin-orders'),
          beamsClient.addDeviceInterest('admin-reviews'),
        ])

        initialized.current = true
        console.log('✅ Admin push notifications registered')
      } catch (err) {
        console.warn('Admin push notifications not available:', err)
      }
    }
    document.head.appendChild(script)
  }, [])
}
