import type { Directive } from 'vue'

type SpotEl = HTMLElement & {
  __hs_move__?: (e: PointerEvent) => void
  __hs_enter__?: () => void
  __hs_leave__?: () => void
}

function setPos(el: HTMLElement, e: PointerEvent) {
  const r = el.getBoundingClientRect()
  const x = Math.max(0, Math.min(r.width, e.clientX - r.left))
  const y = Math.max(0, Math.min(r.height, e.clientY - r.top))
  el.style.setProperty('--hs-x', `${x}px`)
  el.style.setProperty('--hs-y', `${y}px`)
}

export const vHoverSpotlight: Directive<SpotEl, boolean | undefined> = {
  mounted(el, binding) {
    if (binding.value === false) return
    el.classList.add('hs')

    el.__hs_move__ = (e) => setPos(el, e)
    el.__hs_enter__ = () => el.classList.add('hs--on')
    el.__hs_leave__ = () => el.classList.remove('hs--on')

    el.addEventListener('pointermove', el.__hs_move__, { passive: true })
    el.addEventListener('pointerenter', el.__hs_enter__, { passive: true })
    el.addEventListener('pointerleave', el.__hs_leave__, { passive: true })
  },
  unmounted(el) {
    el.classList.remove('hs', 'hs--on')
    if (el.__hs_move__) el.removeEventListener('pointermove', el.__hs_move__)
    if (el.__hs_enter__) el.removeEventListener('pointerenter', el.__hs_enter__)
    if (el.__hs_leave__) el.removeEventListener('pointerleave', el.__hs_leave__)
    delete el.__hs_move__
    delete el.__hs_enter__
    delete el.__hs_leave__
  },
}

