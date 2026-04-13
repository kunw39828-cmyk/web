import { useState } from 'react'
import type { FormEvent } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function buildReply(input: string) {
  if (input.includes('通知')) {
    return '可以进入“通知公告”模块，老师身份可发布通知，学生可查看。'
  }
  if (input.includes('预约') || input.includes('场馆')) {
    return '请在“场馆预约”里选择场馆、审批老师和使用时间段后提交审批。'
  }
  if (input.includes('二手')) {
    return '在“二手市集”点击“我要出售”可创建商品，师生都可以发布和购买。'
  }
  return '已收到你的问题。这是演示版 AI 助手，后续可接入真实大模型接口。'
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好，我是校园服务 AI 助手。你可以问我通知、预约、二手或失物相关问题。',
    },
  ])
  const [input, setInput] = useState('')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()
    if (!text) {
      return
    }

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    }
    const assistantMessage: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: buildReply(text),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>AI 服务助手</h1>
        <p>可快速咨询校园服务使用方式；当前为机器人助手演示版。</p>
      </header>

      <section className="assistant-girl-board">
        <aside className="assistant-girl">
          <div className="assistant-girl__avatar" aria-hidden>
            <span>BOT</span>
          </div>
          <h2>校园机器人助手</h2>
          <p>你好，我是校园服务机器人助手，随时帮你解答流程问题。</p>
          <ul>
            <li>通知公告权限说明</li>
            <li>场馆预约审批指引</li>
            <li>二手交易发布流程</li>
            <li>失物招领操作帮助</li>
          </ul>
        </aside>

        <div className="assistant-girl__chat">
          <div className="chat-list">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`chat-bubble ${message.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}
              >
                <strong>{message.role === 'user' ? '我' : '助手'}</strong>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
          <form className="chat-form" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="请输入你的问题，例如：如何发布通知？"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn--primary">
              发送
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
