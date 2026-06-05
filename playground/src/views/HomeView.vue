<script setup lang="ts">
import { EPage, EColumn, EButton } from '@chancestv/tv-ui'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <EPage id="home" default-focus="nav-components">
    <EColumn :gap="28" class="home">
      <h1 class="home__title">tv-kit playground</h1>
      <p class="home__hint">方向键移动焦点，回车进入</p>

      <EColumn :gap="16" class="home__nav">
        <EButton
          focus-key="nav-components"
          label="基础组件总览"
          variant="primary"
          size="lg"
          @enter="router.push({ name: 'Components' })"
        />
        <EButton
          focus-key="nav-nested"
          label="组件嵌套布局"
          variant="secondary"
          size="lg"
          @enter="router.push({ name: 'Nested' })"
        />
      </EColumn>
    </EColumn>
  </EPage>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 64px;
  box-sizing: border-box;
}
.home__title {
  color: #fff;
  font-size: 40px;
  margin: 0;
}
.home__hint {
  color: #7c89a8;
  font-size: 20px;
  margin: 0;
}
.home__nav {
  margin-top: 24px;
  width: 320px;
}
</style>
