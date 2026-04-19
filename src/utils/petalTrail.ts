type PetalTrailOptions = {
  enabled?: boolean
  maxPerSecond?: number
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isCoarsePointer() {
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function initPetalTrail(opts: PetalTrailOptions = {}) {
  const enabled = opts.enabled ?? true
  if (!enabled) return () => {}
  if (prefersReducedMotion()) return () => {}
  if (isCoarsePointer()) return () => {}

  const maxPerSecond = Math.max(10, Math.min(120, opts.maxPerSecond ?? 55))
  const minInterval = 1000 / maxPerSecond

  let lastTs = 0
  let raf = 0
  let lastEvent: PointerEvent | null = null

  let root = document.getElementById('petal-trail-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'petal-trail-root'
    root.setAttribute('aria-hidden', 'true')
    document.body.appendChild(root)
  }

  function spawn(x: number, y: number) {
    const el = document.createElement('i')
    el.className = 'petal'

    const size = rand(8, 15)
    const drift = rand(-16, 16)
    const rise = rand(-10, -2)
    const rot = rand(-40, 40)
    const rot2 = rot + rand(-140, 140)
    const dur = rand(650, 950)

    // 三种浅色花瓣（贴合暖纸底 + 蓝/青绿）
    const palette = ['rgba(255, 215, 196, 0.9)', 'rgba(210, 235, 255, 0.85)', 'rgba(210, 245, 232, 0.85)']
    const color = palette[(Math.random() * palette.length) | 0]

    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.setProperty('--p-size', `${size}px`)
    el.style.setProperty('--p-dx', `${drift}px`)
    el.style.setProperty('--p-dy', `${rise}px`)
    el.style.setProperty('--p-rot', `${rot}deg`)
    el.style.setProperty('--p-rot2', `${rot2}deg`)
    el.style.setProperty('--p-dur', `${dur}ms`)
    el.style.setProperty('--p-color', color)

    root!.appendChild(el)
    window.setTimeout(() => el.remove(), dur + 80)
  }

  function tick(ts: number) {
    raf = 0
    if (!lastEvent) return

    if (ts - lastTs < minInterval) return
    lastTs = ts

    const e = lastEvent
    // 在光标周围抖动一点，像“散落”
    const x = e.clientX + rand(-6, 6)
    const y = e.clientY + rand(-6, 6)
    spawn(x, y)
  }

  function onMove(e: PointerEvent) {
    // 只响应鼠标（触控笔也可以）
    if (e.pointerType === 'touch') return
    lastEvent = e
    if (!raf) raf = requestAnimationFrame(tick)
  }

  window.addEventListener('pointermove', onMove, { passive: true })

  return () => {
    window.removeEventListener('pointermove', onMove)
  }
}

