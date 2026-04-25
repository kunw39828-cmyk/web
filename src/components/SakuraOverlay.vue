<script setup lang="ts">
import { computed } from 'vue'

type Petal = {
  left: string
  delay: string
  duration: string
  size: string
  drift: string
  opacity: string
}

const PETAL_COUNT = 22

function createPetal(seed: number): Petal {
  const left = `${((seed * 37) % 10000) / 100}%`
  const duration = `${10 + ((seed * 53) % 700) / 100}s`
  const delay = `${-((seed * 71) % 1200) / 100}s`
  const size = `${10 + ((seed * 29) % 900) / 100}px`
  const drift = `${-18 + ((seed * 43) % 3600) / 100}px`
  const opacity = `${0.45 + ((seed * 61) % 45) / 100}`
  return { left, delay, duration, size, drift, opacity }
}

const petals = computed(() => Array.from({ length: PETAL_COUNT }, (_, i) => createPetal(i + 1)))
</script>

<template>
  <div class="sakura-overlay" aria-hidden="true">
    <span
      v-for="(petal, idx) in petals"
      :key="idx"
      class="sakura-overlay__petal"
      :style="{
        left: petal.left,
        animationDelay: petal.delay,
        animationDuration: petal.duration,
        width: petal.size,
        height: `calc(${petal.size} * 0.72)`,
        '--drift': petal.drift,
        opacity: petal.opacity,
      }"
    />
  </div>
</template>

<style scoped>
.sakura-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 120;
  overflow: hidden;
}

.sakura-overlay__petal {
  position: absolute;
  top: -12%;
  border-radius: 110% 90% 100% 20%;
  background: linear-gradient(145deg, rgba(255, 230, 239, 0.95), rgba(255, 191, 216, 0.92));
  box-shadow: 0 0 8px rgba(255, 182, 193, 0.3);
  transform: translate3d(0, 0, 0) rotate(0deg);
  animation-name: sakura-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes sakura-fall {
  0% {
    transform: translate3d(0, -10vh, 0) rotate(0deg);
  }
  25% {
    transform: translate3d(var(--drift), 25vh, 0) rotate(90deg);
  }
  50% {
    transform: translate3d(calc(var(--drift) * -0.6), 50vh, 0) rotate(180deg);
  }
  75% {
    transform: translate3d(calc(var(--drift) * 1.2), 75vh, 0) rotate(260deg);
  }
  100% {
    transform: translate3d(calc(var(--drift) * -0.5), 115vh, 0) rotate(360deg);
  }
}
</style>
