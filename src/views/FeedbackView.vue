<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const message = ref('')
const notice = ref('')
const submitted = ref(false)

function submit() {
  const text = message.value.trim()
  if (text.length < 8) {
    notice.value = '请至少填写 8 个字的描述，便于我们跟进。'
    submitted.value = false
    return
  }
  notice.value = ''
  submitted.value = true
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>意见反馈</h1>
      <p>欢迎提出功能建议、使用问题或内容纠错。当前为演示页，提交后仅在本页提示成功（未接入后端）。</p>
    </header>
    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field">
          <span>反馈内容</span>
          <textarea v-model="message" rows="6" placeholder="请描述问题或建议…" :disabled="submitted" />
        </label>
        <div class="profile-actions feedback-form__actions">
          <button type="submit" class="btn btn--primary" :disabled="submitted">提交反馈</button>
        </div>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
      <p v-if="submitted" class="login__notice feedback-success">感谢反馈，我们已记录您的描述（演示环境未实际上传）。</p>
    </section>
    <div class="profile-actions">
      <RouterLink to="/" class="btn btn--ghost">返回首页</RouterLink>
      <RouterLink to="/news" class="btn btn--ghost">通知公告</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.feedback-form__actions {
  margin-top: 8px;
}
.feedback-success {
  color: #0f766e;
}
</style>
