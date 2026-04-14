<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { apiRequest } from '../api/client'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
const messages = ref<Message[]>([
  {
    id: 'welcome',
    role: 'assistant',
    content: '你好，我是校园服务助手。你可以问通知公告、失物招领、二手市集、场馆预约、登录等问题。',
  },
])
const input = ref('')
const loading = ref(false)
const chatListEl = ref<HTMLElement | null>(null)

const aiMode = ref<{ mode: string; model: string } | null>(null)

const suggestions = [
  '怎么预约场馆？',
  '老师如何审批预约？',
  '二手商品怎么发布？',
  '学号密码登录演示账号是什么？',
]

onMounted(async () => {
  try {
    aiMode.value = await apiRequest<{ mode: string; model: string }>('/ai/status')
  } catch {
    aiMode.value = null
  }
})

function scrollToBottom() {
  nextTick(() => {
    chatListEl.value?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

async function send(raw?: string) {
  const text = (raw ?? input.value).trim()
  if (!text || loading.value) return
  const uid = `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  messages.value.push({ id: uid, role: 'user', content: text })
  input.value = ''
  loading.value = true
  const pendingId = `pending-${Date.now()}`
  messages.value.push({ id: pendingId, role: 'assistant', content: '正在思考…' })
  scrollToBottom()

  try {
    const data = await apiRequest<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    })
    const i = messages.value.findIndex((m) => m.id === pendingId)
    if (i >= 0) {
      messages.value[i] = { id: `a-${Date.now()}`, role: 'assistant', content: data.reply }
    }
  } catch (e) {
    const i = messages.value.findIndex((m) => m.id === pendingId)
    if (i >= 0) {
      messages.value[i] = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `抱歉，请求失败：${e instanceof Error ? e.message : '未知错误'}。请确认已启动 Java 后端（npm run dev:server:java）。`,
      }
    }
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function modeLabel() {
  if (!aiMode.value) return '连接中…'
  if (aiMode.value.mode === 'openai-compatible') return `智能模式 · ${aiMode.value.model}`
  return '校园指引（本地）'
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>AI 服务助手</h1>
      <p>咨询本平台业务流程。</p>
    </header>
    <section class="assistant-girl-board">
      <aside class="assistant-girl">
        <div class="assistant-girl__avatar"><span>BOT</span></div>
        <h2>校园机器人助手</h2>
        <p>覆盖通知、预约、二手、失物、登录与个人中心等说明。</p>
        <p class="ai-mode-pill">{{ modeLabel() }}</p>
      </aside>
      <div class="assistant-girl__chat">
        <div ref="chatListEl" class="chat-list">
          <article
            v-for="m in messages"
            :key="m.id"
            :class="`chat-bubble ${m.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}`"
          >
            <strong>{{ m.role === 'user' ? '我' : '助手' }}</strong>
            <p class="chat-bubble__text">{{ m.content }}</p>
          </article>
        </div>
        <div class="ai-suggestions" aria-label="快捷问题">
          <button
            v-for="(s, idx) in suggestions"
            :key="idx"
            type="button"
            class="btn btn--ghost ai-suggestion-chip"
            :disabled="loading"
            @click="send(s)"
          >
            {{ s }}
          </button>
        </div>
        <form class="chat-form" @submit.prevent="send()">
          <input
            v-model="input"
            type="text"
            placeholder="请输入你的问题"
            autocomplete="off"
            :disabled="loading"
          />
          <button class="btn btn--primary" type="submit" :disabled="loading">发送</button>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ai-mode-pill {
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.25rem 0.65rem;
  font-size: 0.8rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}
.chat-bubble__text {
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.ai-suggestion-chip {
  font-size: 0.8rem;
  padding: 0.35rem 0.65rem;
}
</style>
