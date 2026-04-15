const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  '/api'

function errorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '请求失败'
  const o = data as Record<string, unknown>
  const detail = o.detail
  const message = o.message
  const error = o.error
  if (typeof detail === 'string' && detail) return detail
  if (typeof message === 'string' && message) return message
  if (typeof error === 'string' && error) return error
  return '请求失败'
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  // 合并头：禁止用 `...options` 盖掉 headers，否则带 Authorization 时会丢掉 Content-Type，Spring 会对 @RequestBody 返回 415。
  const headers = new Headers(options.headers)
  if (!['GET', 'HEAD'].includes(method) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  const data: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(errorMessage(data))
  }
  return data as T
}

export function getApiBase() {
  return API_BASE
}
