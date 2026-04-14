<script setup lang="ts">
import { RouterLink } from 'vue-router'

const serviceTiles = [
  { to: '/news', icon: '□', title: '教务服务' },
  { to: '/lost-found', icon: '◎', title: '生活服务' },
  { to: '/ai-assistant', icon: '☰', title: '学习资源' },
]
</script>

<template>
  <div class="page home-lite">
    <section class="home-lite__head">
      <h1>校园e站</h1>
      <p>一站式校园服务入口</p>
    </section>

    <section class="home-lite__panel">
      <div class="home-lite__services">
        <RouterLink v-for="tile in serviceTiles" :key="tile.to" :to="tile.to" class="home-lite__service">
          <span class="home-lite__service-icon" aria-hidden="true">{{ tile.icon }}</span>
          <strong>{{ tile.title }}</strong>
        </RouterLink>
      </div>
      <div class="home-lite__search-wrap">
        <input type="search" placeholder="搜课程/资讯/服务" readonly />
        <button type="button" aria-label="搜索">🔍</button>
      </div>
    </section>

    <section class="home-lite__banner">
      <RouterLink to="/booking" class="home-lite__banner-item home-lite__banner-item--campus">
        <div>
          <strong>校园场馆预约</strong>
          <p>教室、报告厅、活动室线上申请</p>
        </div>
      </RouterLink>
      <RouterLink to="/messages" class="home-lite__banner-item home-lite__banner-item--fresh">
        <div>
          <strong>联系与消息中心</strong>
          <p>二手与失物聊天统一查看</p>
        </div>
      </RouterLink>
      <RouterLink to="/market" class="home-lite__banner-item home-lite__banner-item--market">
        <div>
          <strong>热门校园服务</strong>
          <p>交易、招领、公告同步更新</p>
        </div>
      </RouterLink>
    </section>
  </div>
</template>
