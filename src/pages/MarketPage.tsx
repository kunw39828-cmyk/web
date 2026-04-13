import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMarket } from '../contexts/MarketContext'
import type { Product } from '../contexts/MarketContext'

function formatPrice(yuan: number) {
  return `¥${yuan.toFixed(0)}`
}

export default function MarketPage() {
  const { isAuthenticated, user } = useAuth()
  const { items } = useMarket()
  const location = useLocation()
  const [notice, setNotice] = useState('')

  const onBuy = (product: Product) => {
    if (!isAuthenticated || !user) {
      setNotice('请先登录后再购买商品。')
      return
    }

    setNotice(`下单成功：${user.name} 已购买「${product.title}」。`)
  }

  useEffect(() => {
    if ((location.state as { created?: boolean } | null)?.created) {
      setNotice('商品创建成功，已发布到二手市集。')
    }
  }, [location.state])

  return (
    <div className="page">
      <header className="page-header">
        <h1>二手市集</h1>
        <p>老师和学生均可发布、浏览、购买二手商品。</p>
      </header>

      <section className="profile-card">
        <div className="section__head">
          <h2>交易入口</h2>
          <span className={isAuthenticated ? 'pill pill--ok' : 'pill pill--warn'}>
            {isAuthenticated ? '已登录，可发布和购买' : '未登录，仅可浏览'}
          </span>
        </div>
        <div className="profile-actions">
          <Link to="/market/sell" className="btn btn--primary">
            我要出售
          </Link>
        </div>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>

      <div className="market-grid">
        {items.map((m) => (
          <article key={m.id} className="market-card">
            <div className="market-card__top">
              <h2>{m.title}</h2>
              <p className="price">{formatPrice(m.price)}</p>
            </div>
            <p className="muted">
              {m.seller} · {m.campus}
            </p>
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => onBuy(m)}
            >
              立即购买
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
