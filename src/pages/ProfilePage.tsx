import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const shortcuts = [
  {
    title: '场馆预约',
    desc: '查看预约记录、申请新时段',
    to: '/booking',
  },
  {
    title: '通知公告',
    desc: '浏览与你相关的教务与学工消息',
    to: '/news',
  },
  {
    title: '失物招领',
    desc: '查看自己发布或认领的记录',
    to: '/lost-found',
  },
] as const

export default function ProfilePage() {
  const { bindWechat, logout, user } = useAuth()
  const [notice, setNotice] = useState('')
  const [isBinding, setIsBinding] = useState(false)

  if (!user) {
    return null
  }

  const onBindWechat = async () => {
    try {
      setIsBinding(true)
      await bindWechat()
      setNotice('微信绑定成功，后续可直接使用扫码登录。')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '绑定失败，请稍后重试。')
    } finally {
      setIsBinding(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>个人中心</h1>
        <p>集中查看个人资料、账号安全状态、微信绑定情况与常用服务入口。</p>
      </header>

      <section className="profile-hero">
        <div className="profile-card profile-card--primary">
          <div className="profile-card__avatar" aria-hidden>
            {user.name.slice(0, 1)}
          </div>
          <div className="profile-card__main">
            <h2>{user.name}</h2>
            <p>
              {user.studentId} · {user.department}
            </p>
            <div className="profile-badges">
              <span className="pill pill--ok">
                {user.role === 'student' ? '学生身份' : '教职工身份'}
              </span>
              <span className={user.wechatBound ? 'pill pill--ok' : 'pill pill--warn'}>
                {user.wechatBound ? '微信已绑定' : '微信未绑定'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h3>账号安全</h3>
          <ul className="profile-list">
            <li>
              <span>登录方式</span>
              <strong>学号密码 / 微信扫码</strong>
            </li>
            <li>
              <span>当前 token</span>
              <strong>已签发</strong>
            </li>
            <li>
              <span>微信绑定状态</span>
              <strong>{user.wechatBound ? '已完成' : '待绑定'}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="profile-grid">
        <article className="profile-card">
          <div className="section__head">
            <h2>微信绑定</h2>
            <span className={user.wechatBound ? 'pill pill--ok' : 'pill pill--warn'}>
              {user.wechatBound ? '已绑定' : '未绑定'}
            </span>
          </div>
          <p className="muted">
            绑定后可直接通过微信扫码登录，无需重复输入密码。
          </p>
          <div className="profile-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={onBindWechat}
              disabled={user.wechatBound || isBinding}
            >
              {user.wechatBound ? '已完成绑定' : isBinding ? '绑定中...' : '立即绑定微信'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={logout}>
              退出当前账号
            </button>
          </div>
          {notice ? <p className="login__notice">{notice}</p> : null}
        </article>

        <article className="profile-card">
          <div className="section__head">
            <h2>常用服务</h2>
            <p>登录后优先展示你最常访问的服务入口。</p>
          </div>
          <div className="profile-shortcuts">
            {shortcuts.map((item) => (
              <Link key={item.to} to={item.to} className="tile tile--sky profile-shortcut">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span className="tile__more">进入服务</span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
