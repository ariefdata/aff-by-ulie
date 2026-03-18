'use client'

export const pushService = {
  async register() {
    if (!('serviceWorker' in navigator)) return
    
    try {
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // This requires a VAPID Public Key from your push provider (e.g. Supabase Edge Functions or Firebase)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.warn('VAPID Public Key missing. Push registration skipped.')
          return
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        })
      }
      
      console.log('Push Subscription:', subscription)
      // Send subscription to backend to save for later notification sending
      return subscription
    } catch (err) {
      console.error('Push Service Registration Error:', err)
    }
  },

  async sendLocalNotification(title: string, body: string) {
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    registration.showNotification(title, {
      body,
      icon: '/logo.png',
      vibrate: [200, 100, 200],
      badge: '/logo.png'
    } as any)
  }
}
