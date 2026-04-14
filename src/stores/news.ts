import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '../api/client'
import { useAuthStore } from './auth'

export type NewsPost = {
  id: string | number
  title: string
  date: string
  tag: string
  summary: string
  author: string
  imageUrls?: string[]
}

export const useNewsStore = defineStore('news', () => {
  const posts = ref<NewsPost[]>([])

  async function loadPosts() {
    posts.value = await apiRequest('/news')
  }

  async function createPost(input: Omit<NewsPost, 'id' | 'date'>) {
    const auth = useAuthStore()
    const { token } = storeToRefs(auth)
    const bearer = token.value?.trim()
    if (!bearer) throw new Error('请先登录后再发布（登录状态可能已过期，请重新登录）。')
    const created = await apiRequest('/news', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
      body: JSON.stringify(input),
    })
    posts.value.unshift(created)
  }

  return { posts, loadPosts, createPost }
})
