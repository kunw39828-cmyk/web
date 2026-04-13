import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLostFound } from '../contexts/LostFoundContext'
import type { LostFoundStatus } from '../contexts/LostFoundContext'

export default function PublishLostFoundPage() {
  const { user } = useAuth()
  const { createPost } = useLostFound()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [status, setStatus] = useState<LostFoundStatus>('寻找中')
  const [imageUrl, setImageUrl] = useState('')
  const [notice, setNotice] = useState('')

  const canSubmit = useMemo(
    () => title.trim().length >= 2 && place.trim().length >= 2,
    [place, title],
  )

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageUrl('')
      return
    }
    if (!file.type.startsWith('image/')) {
      setNotice('仅支持上传图片文件。')
      return
    }
    setImageUrl(URL.createObjectURL(file))
    setNotice('')
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setNotice('请先登录后再发布失物招领。')
      return
    }
    if (!canSubmit) {
      setNotice('请完整填写物品名称和地点。')
      return
    }

    createPost({
      title,
      place,
      status,
      imageUrl: imageUrl || undefined,
    })
    navigate('/lost-found', { replace: true, state: { created: true } })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>发布失物招领</h1>
        <p>可上传图片辅助确认，发布后会直接出现在失物招领列表。</p>
      </header>

      <section className="profile-card">
        <form className="login__form" onSubmit={onSubmit}>
          <label className="field">
            <span>物品名称</span>
            <input
              type="text"
              placeholder="例如：黑色钱包"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            <span>发现/丢失地点</span>
            <input
              type="text"
              placeholder="例如：图书馆三楼东区"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </label>
          <label className="field">
            <span>当前状态</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as LostFoundStatus)}>
              <option value="寻找中">寻找中</option>
              <option value="已认领">已认领</option>
            </select>
          </label>
          <label className="field">
            <span>物品图片</span>
            <input type="file" accept="image/*" onChange={onImageChange} />
          </label>
          {imageUrl ? (
            <div className="upload-preview">
              <img src={imageUrl} alt="失物图片预览" />
            </div>
          ) : null}
          <div className="profile-actions">
            <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
              发布信息
            </button>
            <Link to="/lost-found" className="btn btn--ghost">
              返回列表
            </Link>
          </div>
        </form>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>
    </div>
  )
}
