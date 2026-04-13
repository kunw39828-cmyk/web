import { defineStore } from 'pinia'
import { ref } from 'vue'
import { newsItems } from '../data/content'

export type NewsPost = {
  id: string
  title: string
  date: string
  tag: string
  summary: string
  author: string
  imageUrls?: string[]
}

export const useNewsStore = defineStore('news', () => {
  const posts = ref<NewsPost[]>(newsItems.map((item) => ({ ...item, author: '教务处' })))

  function createPost(input: Omit<NewsPost, 'id' | 'date'>) {
    posts.value.unshift({
      ...input,
      id: `${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    })
  }

  return { posts, createPost }
})
