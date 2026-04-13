import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { marketItems } from '../data/content'

export type Product = {
  id: string
  title: string
  price: number
  seller: string
  campus: string
}

type CreateProductInput = {
  title: string
  price: number
  seller: string
  campus: string
}

type MarketContextValue = {
  items: Product[]
  createProduct: (input: CreateProductInput) => Product
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>(marketItems)

  const value = useMemo<MarketContextValue>(
    () => ({
      items,
      createProduct: (input) => {
        const next: Product = {
          id: `${Date.now()}`,
          title: input.title.trim(),
          price: input.price,
          seller: input.seller,
          campus: input.campus,
        }
        setItems((prev) => [next, ...prev])
        return next
      },
    }),
    [items],
  )

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error('useMarket 必须在 MarketProvider 内使用。')
  }
  return context
}
