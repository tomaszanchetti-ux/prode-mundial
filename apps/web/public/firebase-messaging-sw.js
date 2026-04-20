// Firebase Cloud Messaging — background handler.
// Se registra automáticamente al llamar getFcmToken() del cliente web.
// Usa compat SDK vía CDN porque FCM en SW requiere script global (no módulos ESM).

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD00ZSLGxoNc_hlfgGL9YlXDawbULfoLmY",
  authDomain: "prode-mundial-4e419.firebaseapp.com",
  projectId: "prode-mundial-4e419",
  storageBucket: "prode-mundial-4e419.firebasestorage.app",
  messagingSenderId: "59331857833",
  appId: "1:59331857833:web:1b907f74adc79c024cc8b8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Prode Mundial";
  const body = notification.body || data.body || "Tenés una novedad";

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/favicon-32.png",
    tag: data.tag || "prode-default",
    data: {
      url: data.url || "/"
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
