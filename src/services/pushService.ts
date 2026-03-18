'use client'

export const pushService = {
  async register() {
    if (!('serviceWorker' in navigator)) return
    
    try {
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
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
      
      return subscription
    } catch (err) {
      console.error('Push Service Registration Error:', err)
    }
  },

  async checkPermission() {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
  },

  async requestPermission() {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  },

  async getSubscription() {
    if (!('serviceWorker' in navigator)) return null
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  },

  async unsubscribe() {
    const subscription = await this.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      return true
    }
    return false
  },

  async sendLocalNotification(title: string, body: string) {
    if (!('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.ready
      registration.showNotification(title, {
        body,
        icon: '/logo.png',
        vibrate: [200, 100, 200],
        badge: '/logo.png'
      } as any)
    } catch (err) {
      console.error('Local Notification Error:', err)
    }
  }
}
