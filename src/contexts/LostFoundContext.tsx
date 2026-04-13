import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { lostItems } from '../data/content'

export type LostFoundStatus = '寻找中' | '已认领'

export type LostFoundPost = {
  id: string
  title: string
  place: string
  date: string
  status: LostFoundStatus
  imageUrl?: string
}

type CreateLostFoundInput = {
  title: string
  place: string
  status: LostFoundStatus
  imageUrl?: string
}

type LostFoundContextValue = {
  items: LostFoundPost[]
  createPost: (input: CreateLostFoundInput) => LostFoundPost
}

const LostFoundContext = createContext<LostFoundContextValue | null>(null)

export function LostFoundProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LostFoundPost[]>(lostItems)

  const value = useMemo<LostFoundContextValue>(
    () => ({
      items,
      createPost: (input) => {
        const next: LostFoundPost = {
          id: `${Date.now()}`,
          title: input.title.trim(),
          place: input.place.trim(),
          status: input.status,
          imageUrl: input.imageUrl,
          date: new Date().toISOString().slice(0, 10),
        }
        setItems((prev) => [next, ...prev])
        return next
      },
    }),
    [items],
  )

  return <LostFoundContext.Provider value={value}>{children}</LostFoundContext.Provider>
}

export function useLostFound() {
  const context = useContext(LostFoundContext)
  if (!context) {
    throw new Error('useLostFound 必须在 LostFoundProvider 内使用。')
  }
  return context
}
