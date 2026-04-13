import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNews } from '../contexts/NewsContext'

export default function NewsPage() {
  const { isAuthenticated, user } = useAuth()
  const { posts } = useNews()
  const location = useLocation()
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if ((location.state as { created?: boolean } | null)?.created) {
      setNotice('通知发布成功，已展示在公告列表。')
    }
  }, [location.state])

  return (
    <div className="page">
      <header className="page-header">
        <h1>通知公告</h1>
        <p>仅老师可发布通知；学生和老师都可查看全部通知。</p>
      </header>

      <section className="profile-card">
        <div className="section__head">
          <h2>发布入口</h2>
          <span className={user?.role === 'teacher' ? 'pill pill--ok' : 'pill pill--warn'}>
            {user?.role === 'teacher' ? '老师可发布' : '当前无发布权限'}
          </span>
        </div>
        <div className="profile-actions">
          <Link
            to={isAuthenticated ? '/news/publish' : '/login'}
            className="btn btn--primary"
          >
            我要发布
          </Link>
        </div>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>

      <ul className="list-cards">
        {posts.map((n) => (
          <li key={n.id}>
            <article className="list-card">
              <div className="list-card__meta">
                <time dateTime={n.date}>{n.date}</time>
                <span className="tag">{n.tag}</span>
              </div>
              <h2>{n.title}</h2>
              <p>{n.summary}</p>
              {n.imageUrls && n.imageUrls.length > 0 ? (
                <div className="news-cover-grid">
                  {n.imageUrls.map((url) => (
                    <div className="news-cover" key={url}>
                      <img src={url} alt={`${n.title} 配图`} />
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="muted">发布人：{n.author}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
