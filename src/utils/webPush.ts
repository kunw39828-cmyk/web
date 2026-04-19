import { getApiBase } from '../api/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

/** 请求通知权限并在服务端登记 Push 订阅（需已配置 VAPID）。 */
export async function subscribeWebPush(authToken: string): Promise<{ ok: boolean; message?: string }> {
  if (!('PushManager' in window)) {
    return { ok: false, message: '当前浏览器不支持 Web Push。' }
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, message: '未授予通知权限。' }
  }
  const reg = await navigator.serviceWorker.ready
  const res = await fetch(`${getApiBase()}/push/vapid-public-key`)
  const pub = (await res.json()) as { publicKey?: string }
  if (!pub.publicKey || !pub.publicKey.trim()) {
    return { ok: false, message: '服务端未配置 VAPID 公钥。' }
  }
  const key = urlBase64ToUint8Array(pub.publicKey)
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
  })
  const j = sub.toJSON()
  const subRes = await fetch(`${getApiBase()}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken.trim()}`,
    },
    body: JSON.stringify(j),
  })
  const data: unknown = await subRes.json().catch(() => ({}))
  if (!subRes.ok) {
    const msg =
      typeof data === 'object' && data && 'message' in data && typeof (data as { message: string }).message === 'string'
        ? (data as { message: string }).message
        : '订阅失败'
    return { ok: false, message: msg }
  }
  return { ok: true }
}
