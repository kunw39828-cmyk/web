import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNews } from '../contexts/NewsContext'

type NewsTag = '教务' | '学工' | '后勤' | '活动'

export default function PublishNewsPage() {
  const { user } = useAuth()
  const { createPost } = useNews()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tag, setTag] = useState<NewsTag>('教务')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  const canSubmit = useMemo(
    () => user?.role === 'teacher' && title.trim().length >= 4 && summary.trim().length >= 8,
    [summary, title, user?.role],
  )

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      setImageUrls([])
      return
    }

    if (files.length > 3) {
      setNotice('最多上传 3 张图片。')
      return
    }

    const hasInvalidType = files.some((file) => !file.type.startsWith('image/'))
    if (hasInvalidType) {
      setNotice('仅支持上传图片文件。')
      return
    }

    const hasOversize = files.some((file) => file.size > 2 * 1024 * 1024)
    if (hasOversize) {
      setNotice('单张图片大小不能超过 2MB。')
      return
    }

    setImageUrls(files.map((file) => URL.createObjectURL(file)))
    setNotice('')
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setNotice('请先登录后再发布通知。')
      return
    }
    if (user.role !== 'teacher') {
      setNotice('仅老师可发布校园通知。')
      return
    }
    if (!canSubmit) {
      setNotice('请完善标题和正文摘要后再发布。')
      return
    }

    createPost({
      title,
      summary,
      tag,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      author: user.name,
    })
    navigate('/news', { replace: true, state: { created: true } })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>发布校园通知</h1>
        <p>仅老师可发布。可附带图片，方便公告展示和信息确认。</p>
      </header>

      <section className="profile-card">
        <form className="login__form" onSubmit={onSubmit}>
          <label className="field">
            <span>通知标题</span>
            <input
              type="text"
              placeholder="例如：关于运动会调课安排的通知"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            <span>通知分类</span>
            <select value={tag} onChange={(e) => setTag(e.target.value as NewsTag)}>
              <option value="教务">教务</option>
              <option value="学工">学工</option>
              <option value="后勤">后勤</option>
              <option value="活动">活动</option>
            </select>
          </label>
          <label className="field">
            <span>通知摘要</span>
            <textarea
              rows={3}
              placeholder="请填写通知关键内容"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <label className="field">
            <span>附件图片</span>
            <input type="file" accept="image/*" multiple onChange={onImageChange} />
          </label>
          <p className="muted">最多 3 张，单张大小不超过 2MB。</p>
          {imageUrls.length > 0 ? (
            <div className="upload-preview-grid">
              {imageUrls.map((url) => (
                <div className="upload-preview" key={url}>
                  <img src={url} alt="通知图片预览" />
                </div>
              ))}
            </div>
          ) : null}
          <div className="profile-actions">
            <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
              发布通知
            </button>
            <Link to="/news" className="btn btn--ghost">
              返回公告列表
            </Link>
          </div>
        </form>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>
    </div>
  )
}
