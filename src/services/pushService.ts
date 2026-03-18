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
          console.error('CRITICAL: VAPID Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY) is missing in environment variables.')
          alert('Pengaturan gagal: VAPID Public Key belum dikonfigurasi.')
          return
        }

        console.log('Requesting new push subscription with VAPID key...')
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        })
      }
      
      console.log('Successfully subscribed to push:', subscription)
      return subscription
    } catch (err: any) {
      console.error('Push Service Registration Error:', err)
      if (err.name === 'NotAllowedError') {
        alert('Izin notifikasi ditolak oleh browser. Silakan aktifkan di pengaturan browser Anda.')
      } else {
        alert('Gagal mendaftarkan push notification: ' + err.message)
      }
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
