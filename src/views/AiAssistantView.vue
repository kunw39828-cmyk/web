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
        <div ref="chatListEl" class="im-chat-list scroll-silk scroll-silk--plain">
          <div v-for="m in messages" :key="m.id" class="im-row" :class="m.role === 'user' ? 'im-row--me' : 'im-row--bot'">
            <div class="im-avatar" aria-hidden="true">{{ m.role === 'user' ? '我' : 'AI' }}</div>
            <article class="im-bubble" :class="m.role === 'user' ? 'im-bubble--me' : 'im-bubble--bot'">
              <p class="im-text">{{ m.content }}</p>
            </article>
          </div>
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
        <form class="im-chat-form" @submit.prevent="send()">
          <textarea
            v-model="input"
            rows="1"
            placeholder="请输入你的问题…"
            autocomplete="off"
            :disabled="loading"
            class="scroll-silk scroll-silk--plain"
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
  background: rgba(90, 140, 200, 0.14);
  color: var(--brand-dark);
  border: 1px solid rgba(190, 215, 240, 0.75);
}

.assistant-girl__chat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 252, 255, 0.82));
  backdrop-filter: blur(10px);
}

.im-chat-list {
  flex: 1;
  min-height: 58vh;
  max-height: min(72vh, 760px);
  padding: 12px 10px;
  border-radius: 12px;
  border: 1px solid rgba(210, 225, 242, 0.75);
  background: rgba(255, 252, 248, 0.85);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.im-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}

.im-row--me {
  flex-direction: row-reverse;
}

.im-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-weight: 800;
  font-size: 0.78rem;
  color: #fff;
  background: linear-gradient(135deg, #4f8ad4, #3aa89a);
  box-shadow: 0 10px 20px rgba(45, 85, 120, 0.12);
}

.im-row--me .im-avatar {
  background: linear-gradient(135deg, #3d6fa8, #2f5a8c);
}

.im-bubble {
  max-width: min(76%, 640px);
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(210, 225, 242, 0.7);
  box-shadow: 0 10px 26px rgba(45, 85, 120, 0.06);
}

.im-bubble--bot {
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(242, 248, 255, 0.9));
}

.im-bubble--me {
  background: linear-gradient(165deg, rgba(236, 244, 252, 0.98), rgba(228, 238, 252, 0.9));
  border-color: rgba(170, 200, 232, 0.8);
}

.im-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: var(--text);
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
  border-radius: 999px;
  background: rgba(255, 252, 248, 0.9);
}

.im-chat-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
  padding-top: 6px;
}

.im-chat-form textarea {
  width: 100%;
  resize: none;
  min-height: 32px;
  max-height: 68px;
  border-radius: 14px;
  border: 1px solid rgba(210, 225, 242, 0.75);
  padding: 6px 8px;
  font: inherit;
  background: rgba(255, 254, 252, 0.96);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.im-chat-form textarea:focus {
  outline: none;
  border-color: rgba(165, 198, 235, 0.95);
}

.im-chat-form .btn {
  padding: 6px 10px !important;
  min-height: 32px;
  border-radius: 12px;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .assistant-girl-board {
    grid-template-columns: 1fr;
  }
  .im-chat-list {
    min-height: 52vh;
    max-height: min(68vh, 640px);
  }
}
</style>
