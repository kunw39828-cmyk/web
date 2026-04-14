<script setup lang="ts">
/** 微信开放平台 OAuth 回调在 iframe 内打开本页；实际登录态由登录页轮询 /auth/wechat/open/poll 完成。 */
</script>

<template>
  <div class="page">
    <section class="profile-card">
      <p class="muted">微信授权已提交。若浏览器未自动跳转，请返回登录页查看状态；本窗口可关闭。</p>
    </section>
  </div>
</template>
