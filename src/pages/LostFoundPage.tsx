import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLostFound } from '../contexts/LostFoundContext'

export default function LostFoundPage() {
  const { isAuthenticated } = useAuth()
  const { items } = useLostFound()
  const location = useLocation()
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if ((location.state as { created?: boolean } | null)?.created) {
      setNotice('失物招领发布成功，已展示在列表。')
    }
  }, [location.state])

  return (
    <div className="page">
      <header className="page-header">
        <h1>失物招领</h1>
        <p>可通过“我要发布”进入独立发布界面，上传图片并发布招领信息。</p>
      </header>
      <section className="profile-card">
        <div className="section__head">
          <h2>发布入口</h2>
          <span className={isAuthenticated ? 'pill pill--ok' : 'pill pill--warn'}>
            {isAuthenticated ? '已登录，可发布' : '未登录，仅可浏览'}
          </span>
        </div>
        <div className="profile-actions">
          <Link to={isAuthenticated ? '/lost-found/publish' : '/login'} className="btn btn--primary">
            我要发布
          </Link>
        </div>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>
      <ul className="table-list" role="list">
        {items.map((item) => (
          <li key={item.id} className="table-list__row">
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.place}</p>
              {item.imageUrl ? (
                <div className="table-list__thumb">
                  <img src={item.imageUrl} alt={`${item.title} 图片`} />
                </div>
              ) : null}
            </div>
            <time dateTime={item.date}>{item.date}</time>
            <span
              className={
                item.status === '已认领' ? 'pill pill--ok' : 'pill pill--warn'
              }
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
