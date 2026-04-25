const SAKURA_SCRIPT_ID = 'suyanw-sakura-script'
const SAKURA_SCRIPT_SRC = 'https://api.suyanw.cn/api/mouse/yinghua.js'

function removeCanvas() {
  const canvas = document.getElementById('canvas_sakura')
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas)
  }
}

export function disableSakuraEffect() {
  const w = window as Window & { stopp?: () => void; staticx?: boolean }
  if (typeof w.stopp === 'function' && w.staticx) {
    w.stopp()
  } else {
    removeCanvas()
  }
}

export function enableSakuraEffect() {
  const w = window as Window & { stopp?: () => void; staticx?: boolean }

  if (w.staticx) return
  if (typeof w.stopp === 'function') {
    w.stopp()
    return
  }

  if (document.getElementById(SAKURA_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SAKURA_SCRIPT_ID
  script.src = SAKURA_SCRIPT_SRC
  script.async = true
  document.body.appendChild(script)
}
