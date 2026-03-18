import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push Notification Listener
(self as any).addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'Srikandi Elite notification';
  const options = {
    body: data.body ?? 'Update baru tersedia.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url
  };

  event.waitUntil((self as any).registration.showNotification(title, options));
});

// Notification Click Listener
(self as any).addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil((self as any).clients.openWindow(event.notification.data));
  }
});
