<script setup lang="ts">
import { ref } from 'vue'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
const messages = ref<Message[]>([{ id: 'welcome', role: 'assistant', content: '你好，我是校园机器人助手。' }])
const input = ref('')

function reply(text: string) {
  if (text.includes('通知')) return '通知模块里老师可发布，学生可查看。'
  if (text.includes('预约')) return '场馆预约里选择场馆、审批老师和时间段后提交。'
  if (text.includes('二手')) return '二手市集点击“我要出售”可发布商品。'
  return '已收到你的问题，这是演示版机器人助手回复。'
}

function send() {
  const text = input.value.trim()
  if (!text) return
  messages.value.push({ id: `u-${Date.now()}`, role: 'user', content: text })
  messages.value.push({ id: `a-${Date.now()}`, role: 'assistant', content: reply(text) })
  input.value = ''
}
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>AI 服务助手</h1><p>机器人助手面板。</p></header>
    <section class="assistant-girl-board">
      <aside class="assistant-girl">
        <div class="assistant-girl__avatar"><span>BOT</span></div>
        <h2>校园机器人助手</h2>
        <p>可咨询通知、预约、二手、失物等业务流程。</p>
      </aside>
      <div class="assistant-girl__chat">
        <div class="chat-list">
          <article v-for="m in messages" :key="m.id" :class="`chat-bubble ${m.role==='user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}`">
            <strong>{{ m.role === 'user' ? '我' : '助手' }}</strong><p>{{ m.content }}</p>
          </article>
        </div>
        <form class="chat-form" @submit.prevent="send">
          <input v-model="input" type="text" placeholder="请输入你的问题" />
          <button class="btn btn--primary" type="submit">发送</button>
        </form>
      </div>
    </section>
  </div>
</template>
