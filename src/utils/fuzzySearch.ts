/** 简单模糊匹配：优先整段包含，其次按字符顺序子序列匹配（适合中文） */
export function fuzzyScore(query: string, ...parts: string[]): number {
  const q = normalize(query)
  if (!q) return 0
  let best = 0
  for (const raw of parts) {
    const t = normalize(raw)
    if (!t) continue
    if (t.includes(q)) {
      best = Math.max(best, 200 + Math.min(q.length * 3, 60))
      continue
    }
    let ti = 0
    let matched = 0
    for (let i = 0; i < q.length; i++) {
      const ch = q[i]
      const idx = t.indexOf(ch, ti)
      if (idx === -1) {
        matched = -1
        break
      }
      matched++
      ti = idx + 1
    }
    if (matched > 0) {
      best = Math.max(best, 70 + matched * 8)
    }
  }
  return best
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}
