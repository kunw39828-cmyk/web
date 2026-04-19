<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

type Crumb = { label: string; to?: string }

const route = useRoute()

const items = computed<Crumb[]>(() => {
  const raw = route.meta.breadcrumb
  if (Array.isArray(raw) && raw.length) return raw as Crumb[]
  return [{ label: '首页', to: '/' }]
})
</script>

<template>
  <nav class="app-breadcrumb" aria-label="面包屑">
    <ol class="app-breadcrumb__list">
      <template v-for="(c, i) in items" :key="i">
        <li v-if="i < items.length - 1" class="app-breadcrumb__item">
          <RouterLink v-if="c.to" :to="c.to" class="app-breadcrumb__link">{{ c.label }}</RouterLink>
          <span v-else class="app-breadcrumb__link app-breadcrumb__link--muted">{{ c.label }}</span>
          <span class="app-breadcrumb__sep" aria-hidden="true">/</span>
        </li>
        <li v-else class="app-breadcrumb__item app-breadcrumb__item--current">
          {{ c.label }}
        </li>
      </template>
    </ol>
  </nav>
</template>

<style scoped>
.app-breadcrumb {
  margin-bottom: 16px;
}

.app-breadcrumb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 4px;
  font-size: 0.86rem;
}

.app-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}

.app-breadcrumb__item--current {
  font-weight: 700;
  color: var(--text);
}

.app-breadcrumb__link {
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.app-breadcrumb__link:hover {
  color: var(--brand);
}

.app-breadcrumb__link--muted {
  cursor: default;
}

.app-breadcrumb__sep {
  color: var(--border);
  font-weight: 400;
  user-select: none;
}
</style>
