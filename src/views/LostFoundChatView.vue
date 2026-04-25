<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiRequest } from '../api/client'
import { useMarketChatNotifyStore } from '../stores/marketChatNotify'
import { fileToCompressedDataUrl } from '../utils/image'

type ChatRole = 'me' | 'peer'
type ChatMessage = {
  id: string | number
  role: ChatRole
  text: string
  at: string
  read?: boolean
  type?: 'text' | 'image'
  deleted?: boolean
}
type ApiChat = {
  id: number
  itemId: number
  fromId: string
  toId: string
  content: string
  createdAt: string
  read: boolean
  type?: 'text' | 'image'
  deleted?: boolean
}
type ChatSession = {
  itemId: number
  peerId: string
  peerName: string
  itemTitle: string
  lastContent: string
  lastAt: string
  unread: number
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const itemId = computed(() => String(route.query.itemId || ''))
const title = computed(() => String(route.query.title || '未知启事'))
const seller = computed(() => String(route.query.seller || '发布人'))
const sellerId = computed(() => String(route.query.peerId || route.query.sellerId || ''))
const input = ref('')
const messages = ref<ChatMessage[]>([])
const sessions = ref<ChatSession[]>([])
const sessionKeyword = ref('')
const chatListEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const imageInputEl = ref<HTMLInputElement | null>(null)
const sending = ref(false)
const composing = ref(false)
const sendError = ref('')
const previewImage = ref('')
const pinnedKeys = ref<string[]>([])
const hiddenKeys = ref<string[]>([])
let pollTimer: number | null = null

function currentPeerId() {
  return sellerId.value || ''
}

const canChat = computed(() => Boolean(itemId.value && currentPeerId()))

function scrollBottom() {
  nextTick(() => chatListEl.value?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }))
}

async function loadSessions() {
  if (!auth.token) return
  const raw = await apiRequest<ChatSession[]>('/lost-found/chat/sessions', {
    headers: { Authorization: `Bearer ${auth.token}` },
  })
  const hidden = new Set(hiddenKeys.value)
  const pinned = new Set(pinnedKeys.value)
  sessions.value = raw
    .filter((s) => !hidden.has(sessionKey(s.itemId, s.peerId)))
    .sort((a, b) => {
      const ap = pinned.has(sessionKey(a.itemId, a.peerId)) ? 1 : 0
      const bp = pinned.has(sessionKey(b.itemId, b.peerId)) ? 1 : 0
      if (ap !== bp) return bp - ap
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    })
  void useMarketChatNotifyStore().refresh()
}

async function loadMessages() {
  if (!auth.token) return
  if (!itemId.value || !currentPeerId()) {
    messages.value = []
    return
  }
  const list = await apiRequest<ApiChat[]>(
    `/lost-found/${itemId.value}/chat?peerId=${encodeURIComponent(currentPeerId())}&peerName=${encodeURIComponent(seller.value)}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  )
  messages.value = list.map((m) => ({
    id: m.id,
    role: m.fromId === auth.user?.studentId ? 'me' : 'peer',
    text: m.content,
    at: m.createdAt,
    read: m.read,
    type: m.type || 'text',
    deleted: m.deleted,
  }))
  if (messages.value.length === 0) {
    messages.value = [
      {
        id: 'welcome',
        role: 'peer',
        text: `你好，这是失物招领「${title.value}」的联系窗口，可与 ${seller.value} 沟通认领或归还细节。`,
        at: new Date().toISOString(),
      },
    ]
  }
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function onEditorKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || composing.value) return
  if (event.ctrlKey) {
    // Ctrl+Enter 换行（更接近 QQ/IM 习惯）
    event.preventDefault()
    const el = inputEl.value
    if (!el) {
      input.value += '\n'
      return
    }
    const start = el.selectionStart ?? input.value.length
    const end = el.selectionEnd ?? input.value.length
    input.value = `${input.value.slice(0, start)}\n${input.value.slice(end)}`
    nextTick(() => {
      const pos = start + 1
      el.setSelectionRange(pos, pos)
    })
    return
  }
  event.preventDefault()
  send()
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  if (!auth.token) {
    router.push('/login')
    return
  }
  sending.value = true
  sendError.value = ''
  try {
    await apiRequest(`/lost-found/${itemId.value}/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({
        peerId: currentPeerId() || undefined,
        peerName: seller.value,
        type: 'text',
        content: text,
      }),
    })
    input.value = ''
    await Promise.allSettled([loadSessions(), loadMessages()])
    scrollBottom()
  } catch (e) {
    sendError.value = e instanceof Error ? e.message : '发送失败，请重试。'
  } finally {
    sending.value = false
  }
}

async function sendImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!auth.token) {
    router.push('/login')
    return
  }
  if (!file.type.startsWith('image/')) return
  sending.value = true
  sendError.value = ''
  try {
    const dataUrl = await fileToCompressedDataUrl(file, 900, 0.8)
    await apiRequest(`/lost-found/${itemId.value}/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({
        peerId: currentPeerId() || undefined,
        peerName: seller.value,
        type: 'image',
        content: dataUrl,
      }),
    })
    await Promise.allSettled([loadSessions(), loadMessages()])
    scrollBottom()
  } catch (e) {
    sendError.value = e instanceof Error ? e.message : '图片发送失败，请重试。'
  } finally {
    sending.value = false
    if (imageInputEl.value) imageInputEl.value.value = ''
  }
}

async function revokeMessage(id: string | number) {
  if (!auth.token) return
  await apiRequest(`/lost-found/chat/${id}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
  })
  await Promise.allSettled([loadSessions(), loadMessages()])
}

function canRevoke(m: ChatMessage) {
  if (m.role !== 'me' || m.deleted) return false
  const t = new Date(m.at).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t <= 2 * 60 * 1000
}

function openSession(s: ChatSession) {
  router.push({
    path: '/lost-found/chat',
    query: {
      itemId: String(s.itemId),
      title: s.itemTitle,
      seller: s.peerName,
      sellerId: s.peerId,
      peerId: s.peerId,
    },
  })
}

function sessionKey(itemId: number | string, peerId: string) {
  return `${itemId}:${peerId}`
}

const prefKey = computed(() => `lost-found-chat-pref:${auth.user?.studentId || 'guest'}`)

function loadSessionPrefs() {
  const raw = localStorage.getItem(prefKey.value)
  if (!raw) {
    pinnedKeys.value = []
    hiddenKeys.value = []
    return
  }
  try {
    const data = JSON.parse(raw) as { pinned?: string[]; hidden?: string[] }
    pinnedKeys.value = data.pinned || []
    hiddenKeys.value = data.hidden || []
  } catch {
    pinnedKeys.value = []
    hiddenKeys.value = []
  }
}

function saveSessionPrefs() {
  localStorage.setItem(prefKey.value, JSON.stringify({ pinned: pinnedKeys.value, hidden: hiddenKeys.value }))
}

function togglePinSession(s: ChatSession) {
  const key = sessionKey(s.itemId, s.peerId)
  if (pinnedKeys.value.includes(key)) {
    pinnedKeys.value = pinnedKeys.value.filter((k) => k !== key)
  } else {
    pinnedKeys.value.unshift(key)
  }
  saveSessionPrefs()
  loadSessions().catch(() => {})
}

function removeSession(s: ChatSession) {
  const key = sessionKey(s.itemId, s.peerId)
  if (!hiddenKeys.value.includes(key)) hiddenKeys.value.unshift(key)
  pinnedKeys.value = pinnedKeys.value.filter((k) => k !== key)
  saveSessionPrefs()
  if (String(s.itemId) === itemId.value && s.peerId === currentPeerId()) {
    router.push('/lost-found')
  } else {
    loadSessions().catch(() => {})
  }
}

function isPinnedSession(s: ChatSession) {
  return pinnedKeys.value.includes(sessionKey(s.itemId, s.peerId))
}

function goBack() {
  router.back()
}

const filteredSessions = computed(() => {
  const kw = sessionKeyword.value.trim().toLowerCase()
  if (!kw) return sessions.value
  return sessions.value.filter(
    (s) =>
      s.peerName.toLowerCase().includes(kw) ||
      s.itemTitle.toLowerCase().includes(kw),
  )
})

onMounted(async () => {
  if (!auth.token) {
    router.replace({ path: '/login', query: { from: '/lost-found/chat' } })
    return
  }
  loadSessionPrefs()
  if (itemId.value && currentPeerId()) {
    await Promise.allSettled([loadSessions(), loadMessages()])
    scrollBottom()
  } else {
    await loadSessions()
  }
  pollTimer = window.setInterval(() => {
    const tasks: Promise<unknown>[] = [loadSessions()]
    if (itemId.value && currentPeerId()) tasks.push(loadMessages())
    void Promise.allSettled(tasks)
  }, 2500)
})

watch([itemId, sellerId], async () => {
  if (!itemId.value || !currentPeerId()) {
    messages.value = []
    await loadSessions()
    return
  }
  await Promise.allSettled([loadSessions(), loadMessages()])
  scrollBottom()
})

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="lf-chat-header-row">
        <h1>{{ canChat ? '联系发布人 / 对方' : '失物联系' }}</h1>
        <button type="button" class="btn btn--ghost lf-chat-back-btn" @click="goBack">返回上一页</button>
      </div>
      <p v-if="canChat">启事：{{ title }} ｜ 对方：{{ seller }}</p>
      <p v-else class="muted">
        在左侧选择会话即可查看。发布人不能在列表页「联系自己」，请从这里查看对方留言；顶部导航「消息」会显示未读条数。
      </p>
    </header>
    <section class="profile-card qq-chat-panel qq-chat-layout">
      <aside class="qq-session-list">
        <h3>最近会话</h3>
        <input
          v-model="sessionKeyword"
          type="search"
          class="session-search"
          placeholder="搜索联系人/启事"
        />
        <button type="button" class="btn btn--ghost btn--block" @click="loadSessions">刷新会话</button>
        <ul class="scroll-silk">
          <li
            v-for="s in filteredSessions"
            :key="`${s.itemId}-${s.peerId}`"
            :class="{ active: String(s.itemId) === itemId && s.peerId === currentPeerId() }"
            @click="openSession(s)"
          >
            <div class="title-row">
              <strong>{{ isPinnedSession(s) ? '📌 ' : '' }}{{ s.peerName }}</strong>
              <span v-if="s.unread" class="unread">{{ s.unread }}</span>
            </div>
            <p class="item">启事：{{ s.itemTitle }}</p>
            <p class="last">{{ s.lastContent }}</p>
            <div class="session-actions">
              <button type="button" class="mini-btn" @click.stop="togglePinSession(s)">{{ isPinnedSession(s) ? '取消置顶' : '置顶' }}</button>
              <button type="button" class="mini-btn mini-btn--danger" @click.stop="removeSession(s)">删除</button>
            </div>
          </li>
        </ul>
      </aside>

      <div class="qq-main-chat">
        <div v-if="!canChat" class="qq-chat-empty muted">
          <p><strong>请从左侧选择一个会话。</strong></p>
          <p>你是发布人时：他人通过「联系对方」发给你的内容会出现在左侧列表，点进去即可回复。</p>
        </div>
        <template v-else>
          <div ref="chatListEl" class="chat-list qq-chat-list scroll-silk">
            <article v-for="m in messages" :key="m.id" class="qq-message" :class="m.role === 'me' ? 'qq-message--me' : 'qq-message--peer'">
              <div class="qq-avatar">{{ m.role === 'me' ? '我' : 'TA' }}</div>
              <div class="qq-body">
                <div class="qq-meta">
                  <strong>{{ m.role === 'me' ? '我' : seller }}</strong>
                  <span>{{ formatTime(m.at) }}</span>
                <span v-if="m.role === 'me'" class="read-state">{{ m.read ? '已读' : '未读' }}</span>
                <button
                  v-if="canRevoke(m)"
                  type="button"
                  class="revoke-btn"
                  @click="revokeMessage(m.id)"
                >
                  撤回
                </button>
                </div>
                <p v-if="m.deleted" class="qq-bubble qq-bubble--deleted">{{ m.text }}</p>
                <img
                  v-else-if="m.type === 'image'"
                  class="qq-bubble qq-image"
                  :src="m.text"
                  alt="图片消息"
                  @click="previewImage = m.text"
                />
                <p v-else class="qq-bubble">{{ m.text }}</p>
              </div>
            </article>
          </div>
          <form class="qq-chat-form" @submit.prevent="send">
            <input
              ref="imageInputEl"
              type="file"
              accept="image/*"
              style="display: none"
              @change="sendImage"
            />
            <button type="button" class="btn btn--ghost" :disabled="sending" @click="imageInputEl?.click()">发图片</button>
            <textarea
              ref="inputEl"
              v-model="input"
              class="scroll-silk scroll-silk--plain"
              rows="3"
              placeholder="输入消息，Enter 发送，Ctrl+Enter 换行"
              @compositionstart="composing = true"
              @compositionend="composing = false"
              @keydown="onEditorKeydown"
            />
            <button class="btn btn--primary" type="submit" :disabled="sending">发送</button>
          </form>
          <p v-if="sendError" class="login__notice">
            {{ sendError }}
            <button type="button" class="mini-btn" @click="send()">重试发送文本</button>
          </p>
        </template>
      </div>
    </section>
    <div v-if="previewImage" class="image-preview-mask" @click="previewImage = ''">
      <img :src="previewImage" alt="预览大图" class="image-preview-content" />
    </div>
  </div>
</template>

<style scoped>
.lf-chat-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lf-chat-back-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .lf-chat-header-row {
    align-items: flex-start;
  }
}
</style>
