import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMarket } from '../contexts/MarketContext'

export default function SellProductPage() {
  const { user } = useAuth()
  const { createProduct } = useMarket()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [campus, setCampus] = useState('本部')
  const [notice, setNotice] = useState('')

  const canSubmit = useMemo(
    () => title.trim().length >= 2 && Number(price) > 0.01,
    [price, title],
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      setNotice('请先登录后再发布商品。')
      return
    }
    if (!canSubmit) {
      setNotice('请填写完整的商品名称，且价格必须大于 0.01 元。')
      return
    }

    createProduct({
      title,
      price: Number(price),
      campus,
      seller: `${user.name}（${user.role === 'teacher' ? '老师' : '学生'}）`,
    })
    navigate('/market', { replace: true, state: { created: true } })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>我要出售</h1>
        <p>填写商品信息并发布到二手市集，老师和学生都可以发布。</p>
      </header>

      <section className="profile-card">
        <form className="login__form" onSubmit={onSubmit}>
          <label className="field">
            <span>商品名称</span>
            <input
              type="text"
              placeholder="例如：高等数学教材"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            <span>价格（元）</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="field">
            <span>校区</span>
            <select value={campus} onChange={(e) => setCampus(e.target.value)}>
              <option value="本部">本部</option>
              <option value="东校区">东校区</option>
            </select>
          </label>
          <div className="profile-actions">
            <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
              创建商品
            </button>
            <Link to="/market" className="btn btn--ghost">
              返回市集
            </Link>
          </div>
        </form>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>
    </div>
  )
}
