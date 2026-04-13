<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMarketStore } from '../stores/market'

const auth = useAuthStore()
const market = useMarketStore()
const router = useRouter()
const title = ref('')
const price = ref('')
const campus = ref('本部')
const notice = ref('')
const canSubmit = computed(() => title.value.trim().length >= 2 && Number(price.value) > 0.01)

function submit() {
  if (!auth.user) return (notice.value = '请先登录后再发布商品。')
  if (!canSubmit.value) return (notice.value = '价格必须大于 0.01。')
  market.createProduct({
    title: title.value.trim(),
    price: Number(price.value),
    campus: campus.value,
    seller: `${auth.user.name}（${auth.user.role === 'teacher' ? '老师' : '学生'}）`,
  })
  router.replace('/market?created=1')
}
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>我要出售</h1></header>
    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field"><span>商品名称</span><input v-model="title" type="text" /></label>
        <label class="field"><span>价格（元）</span><input v-model="price" type="number" min="0.01" step="0.01" /></label>
        <label class="field"><span>校区</span><select v-model="campus"><option value="本部">本部</option><option value="东校区">东校区</option></select></label>
        <div class="profile-actions"><button class="btn btn--primary" :disabled="!canSubmit">创建商品</button><button type="button" class="btn btn--ghost" @click="router.push('/market')">返回市集</button></div>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
  </div>
</template>
