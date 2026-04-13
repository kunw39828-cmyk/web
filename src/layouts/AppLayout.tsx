import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `nav__link${isActive ? ' nav__link--active' : ''}`

export default function AppLayout() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand" end>
            <span className="brand__mark" aria-hidden />
            <span className="brand__text">校园综合服务平台</span>
          </NavLink>
          <nav className="nav" aria-label="主导航">
            <NavLink to="/" className={navClass} end>
              首页
            </NavLink>
            <NavLink to="/ai-assistant" className={navClass}>
              AI 服务助手
            </NavLink>
            <NavLink to="/news" className={navClass}>
              通知公告
            </NavLink>
            <NavLink to="/lost-found" className={navClass}>
              失物招领
            </NavLink>
            <NavLink to="/market" className={navClass}>
              二手市集
            </NavLink>
            <NavLink to="/booking" className={navClass}>
              场馆预约
            </NavLink>
            {isAuthenticated ? (
              <NavLink to="/profile" className={navClass}>
                个人中心
              </NavLink>
            ) : null}
          </nav>
          <div className="topbar__actions">
            {isAuthenticated && user ? (
              <>
                <div className="topbar__user">
                  <strong>{user.name}</strong>
                  <span>
                    {user.studentId} · {user.department}
                  </span>
                </div>
                <Link to="/profile" className="btn btn--ghost">
                  个人中心
                </Link>
                <button type="button" className="btn btn--ghost" onClick={logout}>
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">
                  登录
                </Link>
                <Link to="/login" className="btn btn--primary">
                  统一认证
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p>演示数据为静态占位，后续可对接学校统一身份认证与业务 API。</p>
      </footer>
    </div>
  )
}
