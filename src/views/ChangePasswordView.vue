<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const notice = ref('')
const submitting = ref(false)

const mustChange = computed(() => Boolean(auth.user?.mustChangePassword))
const from = computed(() => (route.query.from as string) || '/')

async function submit() {
  notice.value = ''
  if (!oldPassword.value || !newPassword.value) return (notice.value = '请填写原密码与新密码。')
  if (newPassword.value.length < 6) return (notice.value = '新密码至少 6 位。')
  if (newPassword.value !== confirmPassword.value) return (notice.value = '两次输入的新密码不一致。')
  try {
    submitting.value = true
    await auth.changePassword(oldPassword.value, newPassword.value)
    notice.value = '密码修改成功，正在返回上一页…'
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    await router.replace(from.value)
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '修改失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>修改密码</h1>
      <p v-if="mustChange" class="muted">检测到你仍在使用学校配发初始密码，请先修改后再继续使用。</p>
      <p v-else class="muted">你可以在此更新登录密码。</p>
    </header>

    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field">
          <span>原密码</span>
          <input v-model="oldPassword" type="password" autocomplete="current-password" />
        </label>
        <label class="field">
          <span>新密码</span>
          <input v-model="newPassword" type="password" autocomplete="new-password" />
        </label>
        <label class="field">
          <span>确认新密码</span>
          <input v-model="confirmPassword" type="password" autocomplete="new-password" />
        </label>
        <button class="btn btn--primary btn--block" :disabled="submitting">
          {{ submitting ? '提交中…' : '确认修改' }}
        </button>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
  </div>
</template>

