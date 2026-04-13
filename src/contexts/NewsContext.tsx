import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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

type CreateNewsInput = {
  title: string
  tag: string
  summary: string
  author: string
  imageUrls?: string[]
}

type NewsContextValue = {
  posts: NewsPost[]
  createPost: (input: CreateNewsInput) => NewsPost
}

const NewsContext = createContext<NewsContextValue | null>(null)

export function NewsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>(
    newsItems.map((item) => ({ ...item, author: '教务处' })),
  )

  const value = useMemo<NewsContextValue>(
    () => ({
      posts,
      createPost: (input) => {
        const next: NewsPost = {
          id: `${Date.now()}`,
          title: input.title.trim(),
          tag: input.tag,
          summary: input.summary.trim(),
          author: input.author,
          imageUrls: input.imageUrls,
          date: new Date().toISOString().slice(0, 10),
        }
        setPosts((prev) => [next, ...prev])
        return next
      },
    }),
    [posts],
  )

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>
}

export function useNews() {
  const context = useContext(NewsContext)
  if (!context) {
    throw new Error('useNews 必须在 NewsProvider 内使用。')
  }
  return context
}
