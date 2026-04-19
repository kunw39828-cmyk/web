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
