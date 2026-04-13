import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type LoginTab = 'password' | 'wechat'

export default function LoginPage() {
  const {
    isAuthenticated,
    loginWithPassword,
    createWechatLoginSession,
    getWechatLoginSessionStatus,
    loginWithWechatSession,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState<LoginTab>('password')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [wechatSessionId, setWechatSessionId] = useState('')
  const [wechatQrText, setWechatQrText] = useState('')
  const [wechatExpiresAt, setWechatExpiresAt] = useState(0)
  const [wechatStatus, setWechatStatus] = useState<'idle' | 'pending' | 'confirmed' | 'expired'>(
    'idle',
  )
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const canPasswordSubmit = useMemo(
    () => studentId.trim().length > 0 && password.trim().length > 0,
    [studentId, password],
  )

  const onPasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canPasswordSubmit) {
      setNotice('请先填写学号和密码。')
      return
    }

    try {
      setIsSubmitting(true)
      await loginWithPassword({ studentId, password })
      navigate(from, { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '登录失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onCreateWechatQr = async () => {
    if (!studentId.trim()) {
      setNotice('请输入已绑定微信的学号，再进行扫码登录。')
      return
    }

    try {
      setIsSubmitting(true)
      const session = await createWechatLoginSession(studentId)
      setWechatSessionId(session.sessionId)
      setWechatQrText(session.qrCodeText)
      setWechatExpiresAt(session.expiresAt)
      setWechatStatus('pending')
      setNotice('二维码生成成功，请在微信端扫码确认。')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '二维码生成失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onConfirmWechatLogin = async () => {
    if (!wechatSessionId) {
      setNotice('请先生成二维码。')
      return
    }
    try {
      setIsSubmitting(true)
      await loginWithWechatSession(wechatSessionId)
      setWechatStatus('confirmed')
      navigate(from, { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '扫码登录失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (tab !== 'wechat' || !wechatSessionId || wechatStatus !== 'pending') {
      return
    }

    const timer = window.setInterval(async () => {
      const status = await getWechatLoginSessionStatus(wechatSessionId)
      if (status === 'expired') {
        setWechatStatus('expired')
        setNotice('二维码已过期，请重新生成。')
      }
    }, 2000)

    return () => window.clearInterval(timer)
  }, [getWechatLoginSessionStatus, tab, wechatSessionId, wechatStatus])

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="page page--login">
      <div className="login-window">
        <div className="login-window__header">
          <div className="login-window__avatar" aria-hidden>
            校
          </div>
          <div>
            <h1>校园综合服务平台</h1>
            <p>使用学号密码或微信扫码安全登录</p>
          </div>
        </div>

        <div className="login__card">
          <div className="login__tabs" role="tablist" aria-label="登录方式">
            <button
              type="button"
              className={`login__tab${tab === 'password' ? ' login__tab--active' : ''}`}
              onClick={() => setTab('password')}
            >
              学号密码登录
            </button>
            <button
              type="button"
              className={`login__tab${tab === 'wechat' ? ' login__tab--active' : ''}`}
              onClick={() => setTab('wechat')}
            >
              微信扫码登录
            </button>
          </div>

          {tab === 'password' ? (
            <form className="login__form" onSubmit={onPasswordLogin}>
              <label className="field">
                <span>学号</span>
                <input
                  type="text"
                  placeholder="请输入学号"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </label>
              <label className="field">
                <span>密码</span>
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn--primary btn--block">
                {isSubmitting ? '登录中...' : '登录'}
              </button>
              <p className="muted">
                演示账号：学生 `20260001 / 123456`、`20260002 / 654321`；老师
                `T2026001 / 888888`
              </p>
            </form>
          ) : (
            <div className="login__wechat">
              <label className="field">
                <span>绑定学号</span>
                <input
                  type="text"
                  placeholder="请输入已绑定微信的学号"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </label>
              <div className="qrcode" aria-hidden>
                <div className="qrcode__inner">
                  {wechatQrText ? (
                    <>
                      <strong>微信扫码登录码</strong>
                      <span>{wechatQrText}</span>
                    </>
                  ) : (
                    '点击下方按钮生成二维码'
                  )}
                </div>
              </div>
              {wechatSessionId ? (
                <p className="muted">
                  状态：
                  {wechatStatus === 'pending'
                    ? `待确认（${Math.max(0, Math.ceil((wechatExpiresAt - Date.now()) / 1000))}s）`
                    : wechatStatus === 'expired'
                      ? '已过期'
                      : '已确认'}
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={onCreateWechatQr}
                disabled={isSubmitting}
              >
                {isSubmitting ? '处理中...' : '生成二维码'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={onConfirmWechatLogin}
                disabled={isSubmitting || !wechatSessionId || wechatStatus !== 'pending'}
              >
                我已扫码并确认登录
              </button>
              <p className="muted">未绑定时可先通过学号密码登录，在个人中心进行微信绑定。</p>
            </div>
          )}

          {notice ? <p className="login__notice">{notice}</p> : null}
        </div>

        <footer className="login-window__footer">
          <p className="muted">
            初次使用可先通过
            <strong> 学号密码 </strong>
            登录，再在个人中心完成微信绑定。
          </p>
        </footer>
      </div>
    </div>
  )
}
