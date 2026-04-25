<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>联系我们</h1>
      <p>校园综合服务平台运维与咨询入口。</p>
    </header>
    <section class="profile-card">
      <h2 class="static-page__h2">咨询方式</h2>
      <p class="muted">工作日 9:00–17:00 优先响应；紧急事务请电话联系。</p>
      <ul class="static-page__list">
        <li><strong>信息化办公室</strong>：010-0000-0000（示例，请替换为校内分机）</li>
        <li><strong>服务邮箱</strong>：campus-support@example.edu（示例）</li>
        <li><strong>办公地点</strong>：行政楼一层网络信息中心窗口</li>
      </ul>
    </section>
    <div class="profile-actions">
      <RouterLink to="/" class="btn btn--primary">返回首页</RouterLink>
      <RouterLink to="/news" class="btn btn--ghost">通知公告</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.static-page__h2 {
  margin: 0 0 10px;
  font-size: 1.1rem;
}
.static-page__list {
  margin: 12px 0 0;
  padding-left: 1.2rem;
  color: var(--text);
  line-height: 1.65;
}
.static-page__list li + li {
  margin-top: 8px;
}
</style>
