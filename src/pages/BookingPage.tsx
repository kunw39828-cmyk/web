import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { teacherApprovers, venues } from '../data/content'

type BookingRequest = {
  id: string
  venueName: string
  applicant: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  managerTeacher: string
  managerDepartment: string
  status: '待老师审批' | '已通过' | '已驳回'
}

export default function BookingPage() {
  const { user } = useAuth()
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [notice, setNotice] = useState('')
  const [requests, setRequests] = useState<BookingRequest[]>([])

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId],
  )

  const venueTeachers = useMemo(
    () =>
      teacherApprovers.filter((teacher) =>
        selectedVenue ? teacher.managedVenueIds.includes(selectedVenue.id) : false,
      ),
    [selectedVenue],
  )

  const selectedTeacher = useMemo(
    () => venueTeachers.find((teacher) => teacher.id === selectedTeacherId) ?? null,
    [selectedTeacherId, venueTeachers],
  )

  useEffect(() => {
    const fallbackTeacher = venueTeachers[0]
    setSelectedTeacherId(fallbackTeacher?.id ?? '')
  }, [selectedVenueId, venueTeachers])

  const isTimeRangeValid = Boolean(startTime && endTime && startTime < endTime)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      setNotice('请先登录后再提交预约申请。')
      return
    }
    if (!selectedVenue) {
      setNotice('请先选择场馆。')
      return
    }
    if (!selectedTeacher) {
      setNotice('请先从老师审批列表中选择审批老师。')
      return
    }
    if (!date) {
      setNotice('请选择使用日期。')
      return
    }
    if (!startTime || !endTime) {
      setNotice('请填写开始时间和结束时间。')
      return
    }
    if (!isTimeRangeValid) {
      setNotice('开始时间需早于结束时间。')
      return
    }
    if (purpose.trim().length < 2) {
      setNotice('请填写用途（至少 2 个字）。')
      return
    }

    const nextRequest: BookingRequest = {
      id: `${Date.now()}`,
      venueName: selectedVenue.name,
      applicant: `${user.name}（${user.studentId}）`,
      date,
      startTime,
      endTime,
      purpose: purpose.trim(),
      managerTeacher: selectedTeacher.name,
      managerDepartment: selectedTeacher.department,
      status: '待老师审批',
    }

    setRequests((prev) => [nextRequest, ...prev])
    setNotice(
      `申请已提交，已发送给 ${selectedTeacher.name}（${selectedTeacher.department}）审批。`,
    )
    setDate('')
    setStartTime('')
    setEndTime('')
    setPurpose('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>场馆预约</h1>
        <p>
          当前以登录身份进行预约：
          {user ? `${user.name}（${user.studentId}）` : '未登录'}
          。提交后会自动分配给对应场馆管理老师审批。
        </p>
      </header>

      <section className="profile-card">
        <div className="section__head">
          <h2>创建预约申请</h2>
          <span className={user ? 'pill pill--ok' : 'pill pill--warn'}>
            {user ? '已登录，可提交审批' : '未登录，无法提交'}
          </span>
        </div>
        <form className="login__form" onSubmit={onSubmit}>
          <label className="field">
            <span>选择场馆</span>
            <select value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)}>
              {venues.map((venue) => (
                <option value={venue.id} key={venue.id}>
                  {venue.name}（{venue.building}）
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>选择审批老师</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              {venueTeachers.length === 0 ? (
                <option value="">当前场馆暂无可选审批老师</option>
              ) : (
                venueTeachers.map((teacher) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name}（{teacher.department}）
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="booking-time-grid">
            <label className="field">
              <span>使用日期</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>开始时间</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="field">
              <span>结束时间</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>使用用途</span>
            <textarea
              rows={3}
              placeholder="例如：班级学术分享会"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={!user}>
            提交老师审批
          </button>
        </form>
        {notice ? <p className="login__notice">{notice}</p> : null}
      </section>

      <ul className="list-cards">
        {venues.map((v) => (
          <li key={v.id}>
            <article className="list-card">
              <div>
                <h2>{v.name}</h2>
                <p className="muted">
                  {v.building} · 开放 {v.open} · 可容纳 {v.seats} 人
                </p>
                <p className="muted">
                  场馆管理老师：{v.managerTeacher}（{v.managerDepartment}）
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <section className="profile-card booking-requests">
        <div className="section__head">
          <h2>我的预约申请</h2>
          <p>展示已提交申请及对应审批老师。</p>
        </div>
        {requests.length === 0 ? (
          <p className="muted">暂无申请记录，先选择场馆和使用时间段提交一条吧。</p>
        ) : (
          <ul className="list-cards">
            {requests.map((request) => (
              <li key={request.id}>
                <article className="list-card">
                  <div className="list-card__meta">
                    <span>{request.venueName}</span>
                    <span className="pill pill--warn">{request.status}</span>
                  </div>
                  <p>
                    使用时间：{request.date} {request.startTime} - {request.endTime}
                  </p>
                  <p>用途：{request.purpose}</p>
                  <p className="muted">申请人：{request.applicant}</p>
                  <p className="muted">
                    审批老师：{request.managerTeacher}（{request.managerDepartment}）
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
