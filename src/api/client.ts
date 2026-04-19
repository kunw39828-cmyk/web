const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  '/api'

function errorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '请求失败'
  const o = data as Record<string, unknown>
  const detail = o.detail
  const message = o.message
  const error = o.error
  const title = o.title
  if (typeof detail === 'string' && detail) return detail
  if (typeof message === 'string' && message) return message
  if (typeof error === 'string' && error) return error
  if (typeof title === 'string' && title) return title
  return '请求失败'
}

function looksLikeHtml(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('<!DOCTYPE') || t.startsWith('<html') || t.startsWith('<HTML')
}

function fallbackHttpError(status: number, statusText: string, rawBody: string): string {
  if (status === 413) {
    return (
      'HTTP 413：请求正文过大（聊天发图会把图片编成 base64 放进 JSON，体积远大于原图）。' +
      '使用本地 Node 后端时请重启 `npm run dev:server`（已放宽 JSON 上限）；若经 Nginx 反代，请增大 `client_max_body_size`。'
    )
  }
  const hint =
    status === 404
      ? '接口不存在。若使用 VITE_API_BASE_URL，请写成带 /api 的地址（如 http://localhost:3001/api），并确认已启动 dev:server。'
      : status === 0 || status >= 500
        ? '服务器异常或未启动，请检查本地 API 是否在运行。'
        : ''
  const suffix = hint ? ` ${hint}` : ''
  if (rawBody && !looksLikeHtml(rawBody)) {
    const snippet = rawBody.replace(/\s+/g, ' ').trim().slice(0, 160)
    if (snippet) return `HTTP ${status} ${statusText || ''}：${snippet}${suffix}`.trim()
  }
  if (looksLikeHtml(rawBody)) {
    return `HTTP ${status}：返回了网页而非 JSON（通常是代理未命中或路径错误）。${suffix}`.trim()
  }
  return `HTTP ${status} ${statusText || '请求失败'}${suffix}`.trim()
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  // 合并头：禁止用 `...options` 盖掉 headers，否则带 Authorization 时会丢掉 Content-Type，Spring 会对 @RequestBody 返回 415。
  const headers = new Headers(options.headers)
  if (!['GET', 'HEAD'].includes(method) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      msg.includes('Failed to fetch') || msg.includes('NetworkError')
        ? '无法连接后端（请确认服务已启动且端口正确）'
        : msg,
    )
  }
  const raw = await response.text()
  let data: unknown = {}
  if (raw) {
    try {
      data = JSON.parse(raw) as unknown
    } catch {
      if (!response.ok) {
        throw new Error(fallbackHttpError(response.status, response.statusText, raw))
      }
      throw new Error('响应不是合法 JSON')
    }
  }
  if (!response.ok) {
    const msg = errorMessage(data)
    if (msg !== '请求失败') throw new Error(msg)
    throw new Error(fallbackHttpError(response.status, response.statusText, raw))
  }
  return data as T
}

export function getApiBase() {
  return API_BASE
}
