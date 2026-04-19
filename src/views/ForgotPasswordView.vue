<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const studentId = ref('')
const name = ref('')
const idCardLast4 = ref('')
const notice = ref('')
const submitting = ref(false)

const from = computed(() => (route.query.from as string) || '/login')

async function submit() {
  notice.value = ''
  const sid = studentId.value.trim()
  const nm = name.value.trim()
  const last4 = idCardLast4.value.trim()
  if (!sid || !nm || !last4) return (notice.value = '请填写学号、姓名与身份证后四位。')
  if (!/^[0-9]{4}$/.test(last4)) return (notice.value = '身份证后四位格式不正确。')
  try {
    submitting.value = true
    await auth.forgotPassword(sid, nm, last4)
    notice.value = '已重置为学校配发初始密码，请返回登录。首次登录后需要修改密码。'
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '重置失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>忘记密码</h1>
      <p class="muted">验证学号、姓名与身份证后四位后，将密码重置为学校配发初始密码；登录后需立即修改。</p>
    </header>

    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field"><span>学号</span><input v-model="studentId" type="text" autocomplete="username" /></label>
        <label class="field"><span>姓名</span><input v-model="name" type="text" autocomplete="name" /></label>
        <label class="field"
          ><span>身份证后四位</span
          ><input v-model="idCardLast4" type="password" inputmode="numeric" maxlength="4" autocomplete="off"
        /></label>
        <button class="btn btn--primary btn--block" :disabled="submitting">
          {{ submitting ? '处理中…' : '重置为初始密码' }}
        </button>
      </form>
      <div class="profile-actions">
        <button type="button" class="btn btn--ghost" @click="router.replace(from)">返回登录</button>
      </div>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
  </div>
</template>

