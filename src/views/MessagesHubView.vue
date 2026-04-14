<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useMarketChatNotifyStore } from '../stores/marketChatNotify'

const chatNotify = useMarketChatNotifyStore()
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>消息中心</h1>
      <p class="muted">二手市集与失物招领的联系会话分别入口；未读角标在顶部「消息」汇总显示。</p>
    </header>
    <section class="hub-grid">
      <RouterLink to="/market/chat" class="hub-card">
        <h2>二手市集联系</h2>
        <p class="muted">与买家/卖家沟通价格、面交等</p>
        <span v-if="chatNotify.unreadMarket > 0" class="nav-badge">{{ chatNotify.unreadMarket > 99 ? '99+' : chatNotify.unreadMarket }}</span>
        <span class="tile__more">进入 →</span>
      </RouterLink>
      <RouterLink to="/lost-found/chat" class="hub-card hub-card--sky">
        <h2>失物招领联系</h2>
        <p class="muted">与发布人沟通认领、归还细节</p>
        <span v-if="chatNotify.unreadLost > 0" class="nav-badge">{{ chatNotify.unreadLost > 99 ? '99+' : chatNotify.unreadLost }}</span>
        <span class="tile__more">进入 →</span>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.hub-card {
  position: relative;
  display: block;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hub-card:hover {
  border-color: #6366f1;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.12);
}
.hub-card--sky:hover {
  border-color: #0ea5e9;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.12);
}
.hub-card h2 {
  margin: 0 0 8px;
  font-size: 1.15rem;
}
.hub-card .nav-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}
.tile__more {
  display: inline-block;
  margin-top: 12px;
  font-weight: 600;
  color: #4f46e5;
}
.hub-card--sky .tile__more {
  color: #0369a1;
}
</style>
