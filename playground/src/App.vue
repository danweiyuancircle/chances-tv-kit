<script setup lang="ts">
// playground 根：仅承载路由出口。KeepAlive 让各 demo 页焦点位置在切回时恢复。
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
body { margin: 0; background: #0b0f1a; font-family: system-ui, sans-serif; }
</style>
