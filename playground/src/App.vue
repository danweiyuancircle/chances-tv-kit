<script setup lang="ts">
import { ref } from 'vue'
import { EPage, EColumn, ERow, EButton, EVirtual, EFocusable } from '@chancestv/tv-ui'

const nums = ref(Array.from({ length: 30 }, (_, i) => i + 1))
</script>

<template>
  <EPage id="home" default-focus="btn-1">
    <EColumn :gap="32" section class="root">
      <h1 class="title">tv-kit playground</h1>

      <ERow :gap="20" section>
        <EButton focus-key="btn-1" label="按钮一" variant="primary" />
        <EButton focus-key="btn-2" label="按钮二" variant="secondary" />
        <EButton focus-key="btn-3" label="按钮三" variant="ghost" />
      </ERow>

      <p class="hint">↓ 横向虚拟列表（焦点居中滚动）</p>
      <EVirtual
        section-id="vlist"
        direction="horizontal"
        :items="nums"
        :item-width="120"
        :item-height="80"
        :main-visible="6"
        :gap="14"
        focus-key-prefix="cell"
        v-slot="{ item, focusKey }"
      >
        <EFocusable :focus-key="focusKey" v-slot="{ focused }">
          <div class="cell" :class="{ on: focused }">#{{ item }}</div>
        </EFocusable>
      </EVirtual>
    </EColumn>
  </EPage>
</template>

<style>
body { margin: 0; background: #0b0f1a; font-family: system-ui, sans-serif; }
.root { padding: 48px; }
.title { color: #fff; font-size: 32px; margin: 0; }
.hint { color: #7c89a8; font-size: 18px; margin: 0; }
.cell {
  width: 120px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: #1c2333; color: #9aa4bd; border-radius: 8px;
  font-size: 22px; transition: transform .15s ease, background .15s ease;
}
.cell.on { background: #3b6ef5; color: #fff; transform: scale(1.08); }
</style>
