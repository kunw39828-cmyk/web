<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>平台指南</h1>
      <p>快速了解本平台主要功能与使用说明。</p>
    </header>
    <section class="profile-card">
      <h2 class="static-page__h2">功能概览</h2>
      <ul class="static-page__list">
        <li><strong>通知公告</strong>：查看教务与校园通知；教师账号可发布通知。</li>
        <li><strong>失物寻找</strong>：发布与浏览失物、招领信息，可与发布者沟通。</li>
        <li><strong>二手市场</strong>：发布闲置、浏览商品，登录后可发起会话。</li>
        <li><strong>场馆预约</strong>：登录后预约校内场地，按规则提交申请。</li>
        <li><strong>个人中心</strong>：管理资料、安全设置与消息相关入口。</li>
      </ul>
      <p class="muted static-page__note">更多说明以校内实际政策为准；部分功能需登录或对应身份权限。</p>
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
.static-page__note {
  margin-top: 16px;
}
</style>
