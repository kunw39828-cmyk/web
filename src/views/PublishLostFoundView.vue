<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLostFoundStore } from '../stores/lostFound'

const router = useRouter()
const store = useLostFoundStore()
const title = ref('')
const place = ref('')
const status = ref<'寻找中' | '已认领'>('寻找中')
const imageUrl = ref('')
const notice = ref('')
const canSubmit = computed(() => title.value.trim().length >= 2 && place.value.trim().length >= 2)

function onImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return void (notice.value = '仅支持图片文件。')
  imageUrl.value = URL.createObjectURL(file)
}

function submit() {
  if (!canSubmit.value) return (notice.value = '请完整填写物品名称和地点。')
  store.createPost({ title: title.value, place: place.value, status: status.value, imageUrl: imageUrl.value || undefined })
  router.replace('/lost-found?created=1')
}
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>发布失物招领</h1></header>
    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field"><span>物品名称</span><input v-model="title" type="text" /></label>
        <label class="field"><span>地点</span><input v-model="place" type="text" /></label>
        <label class="field"><span>状态</span><select v-model="status"><option value="寻找中">寻找中</option><option value="已认领">已认领</option></select></label>
        <label class="field"><span>图片</span><input type="file" accept="image/*" @change="onImage" /></label>
        <div v-if="imageUrl" class="upload-preview"><img :src="imageUrl" alt="预览" /></div>
        <div class="profile-actions"><button class="btn btn--primary" :disabled="!canSubmit">发布信息</button><button type="button" class="btn btn--ghost" @click="router.push('/lost-found')">返回列表</button></div>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
  </div>
</template>
