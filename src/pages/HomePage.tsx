import { Link } from 'react-router-dom'
import { newsItems } from '../data/content'

const tiles = [
  {
    to: '/ai-assistant',
    title: 'AI 服务助手',
    desc: '智能问答校园业务办理流程与常见问题。',
    tone: 'tile--sky',
  },
  {
    to: '/news',
    title: '通知公告',
    desc: '教务、学工、后勤等官方信息一站聚合。',
    tone: 'tile--sky',
  },
  {
    to: '/lost-found',
    title: '失物招领',
    desc: '发布与浏览拾物信息，减少校园「小丢失」。',
    tone: 'tile--teal',
  },
  {
    to: '/market',
    title: '二手市集',
    desc: '教材、数码、生活用品的安全校内流转。',
    tone: 'tile--amber',
  },
  {
    to: '/booking',
    title: '场馆预约',
    desc: '报告厅、研讨室、活动室在线选时段。',
    tone: 'tile--violet',
  },
] as const

export default function HomePage() {
  const latest = newsItems.slice(0, 2)

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Campus One-Stop</p>
          <h1 className="hero__title">把校园服务装进一个入口</h1>
          <p className="hero__lead">
            面向师生的综合服务前端骨架：模块化路由、清晰信息架构，便于后续接入真实接口与权限体系。
          </p>
          <div className="hero__cta">
            <Link to="/news" className="btn btn--primary">
              查看最新通知
            </Link>
            <Link to="/booking" className="btn btn--ghost">
              预约场馆
            </Link>
          </div>
        </div>
        <div className="hero__panel" aria-hidden>
          <div className="hero__stat">
            <span className="hero__stat-value">12+</span>
            <span className="hero__stat-label">计划接入业务域</span>
          </div>
          <ul className="hero__list">
            <li>统一身份与角色（学生 / 教职工）</li>
            <li>消息订阅与待办聚合</li>
            <li>移动端适配与无障碍优化</li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>服务入口</h2>
          <p>从首页快速跳转到各子模块，路由已就绪。</p>
        </div>
        <div className="tile-grid">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to} className={`tile ${t.tone}`}>
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
              <span className="tile__more">进入</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--muted">
        <div className="section__head">
          <h2>近期动态</h2>
          <Link to="/news" className="link-inline">
            查看全部
          </Link>
        </div>
        <ul className="news-preview">
          {latest.map((n) => (
            <li key={n.id}>
              <article className="news-preview__item">
                <time dateTime={n.date}>{n.date}</time>
                <span className="tag">{n.tag}</span>
                <h3>
                  <Link to="/news">{n.title}</Link>
                </h3>
                <p>{n.summary}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
