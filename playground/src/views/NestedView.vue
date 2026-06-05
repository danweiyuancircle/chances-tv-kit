<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { EPage, ERow, EColumn, EButton, EFocusable } from '@chancestv/tv-ui'
import { useFocusScroll } from '../composables/useFocusScroll'

const router = useRouter()

const scrollEl = ref<HTMLElement | null>(null)
const { scrollY } = useFocusScroll(scrollEl, 600)
</script>

<template>
  <EPage id="nested" default-focus="n-back" class="page">
    <div class="n-head">
      <EButton focus-key="n-back" label="返回" size="sm" @enter="router.push({ name: 'Home' })" />
      <h1 class="n-title">组件嵌套布局</h1>
    </div>

    <div ref="scrollEl" class="n-scroll">
      <div class="n-track" :style="{ transform: `translateY(${-scrollY}px)`, transition: 'transform 0.18s ease' }">

        <!-- 1. EColumn 包多个 ERow：经典上下多行，行内左右、跨行上下 -->
        <section class="n-group">
          <div class="n-label">① EColumn ▸ 多个 ERow（上下多行 / 行内左右）</div>
          <EColumn id="n-grid" :gap="16">
            <ERow id="n-grid-r1" :gap="16">
              <EFocusable v-for="i in 4" :key="i" :focus-key="`n-g1-${i}`" v-slot="{ focused }">
                <div class="tile" :class="{ hot: focused }">1-{{ i }}</div>
              </EFocusable>
            </ERow>
            <ERow id="n-grid-r2" :gap="16">
              <EFocusable v-for="i in 4" :key="i" :focus-key="`n-g2-${i}`" v-slot="{ focused }">
                <div class="tile" :class="{ hot: focused }">2-{{ i }}</div>
              </EFocusable>
            </ERow>
            <ERow id="n-grid-r3" :gap="16">
              <EFocusable v-for="i in 4" :key="i" :focus-key="`n-g3-${i}`" v-slot="{ focused }">
                <div class="tile" :class="{ hot: focused }">3-{{ i }}</div>
              </EFocusable>
            </ERow>
          </EColumn>
        </section>

        <!-- 2. ERow 包多个 EColumn：左右多列，列内上下、跨列左右 -->
        <section class="n-group">
          <div class="n-label">② ERow ▸ 多个 EColumn（左右多列 / 列内上下）</div>
          <ERow id="n-cols" :gap="24" align="start">
            <EColumn v-for="c in 4" :key="c" :id="`n-col-${c}`" :gap="16">
              <EFocusable v-for="r in 3" :key="r" :focus-key="`n-c${c}-${r}`" v-slot="{ focused }">
                <div class="tile" :class="{ hot: focused }">{{ c }}·{{ r }}</div>
              </EFocusable>
            </EColumn>
          </ERow>
        </section>

        <!-- 3. ERow 嵌 ERow：一行里再分两组，组内左右优先、跨组连续 -->
        <section class="n-group">
          <div class="n-label">③ ERow ▸ 嵌 ERow（行内分组）</div>
          <ERow id="n-rr" :gap="48">
            <ERow id="n-rr-a" :gap="12">
              <EFocusable v-for="i in 3" :key="i" :focus-key="`n-rra-${i}`" v-slot="{ focused }">
                <div class="tile sm" :class="{ hot: focused }">A{{ i }}</div>
              </EFocusable>
            </ERow>
            <ERow id="n-rr-b" :gap="12">
              <EFocusable v-for="i in 3" :key="i" :focus-key="`n-rrb-${i}`" v-slot="{ focused }">
                <div class="tile sm" :class="{ hot: focused }">B{{ i }}</div>
              </EFocusable>
            </ERow>
          </ERow>
        </section>

        <!-- 4. EColumn 嵌 EColumn：纵向再分两段 -->
        <section class="n-group">
          <div class="n-label">④ EColumn ▸ 嵌 EColumn（纵向分段）</div>
          <ERow :gap="24" align="start">
            <EColumn id="n-cc" :gap="20">
              <EColumn id="n-cc-a" :gap="10">
                <EFocusable v-for="i in 2" :key="i" :focus-key="`n-cca-${i}`" v-slot="{ focused }">
                  <div class="tile wide" :class="{ hot: focused }">段A · {{ i }}</div>
                </EFocusable>
              </EColumn>
              <EColumn id="n-cc-b" :gap="10">
                <EFocusable v-for="i in 2" :key="i" :focus-key="`n-ccb-${i}`" v-slot="{ focused }">
                  <div class="tile wide" :class="{ hot: focused }">段B · {{ i }}</div>
                </EFocusable>
              </EColumn>
            </EColumn>
          </ERow>
        </section>

        <!-- 5. 混合：EColumn ▸ (ERow 顶栏 + ERow 多列 + ERow 底栏) -->
        <section class="n-group">
          <div class="n-label">⑤ 混合嵌套（顶栏 + 内容多列 + 底栏）</div>
          <EColumn id="n-mix" :gap="16">
            <ERow id="n-mix-top" :gap="12">
              <EButton focus-key="n-mix-t1" label="顶栏一" variant="ghost" />
              <EButton focus-key="n-mix-t2" label="顶栏二" variant="ghost" />
            </ERow>
            <ERow id="n-mix-body" :gap="16" align="start">
              <EColumn v-for="c in 3" :key="c" :id="`n-mix-col-${c}`" :gap="12">
                <EFocusable v-for="r in 2" :key="r" :focus-key="`n-mix-${c}-${r}`" v-slot="{ focused }">
                  <div class="tile" :class="{ hot: focused }">{{ c }}-{{ r }}</div>
                </EFocusable>
              </EColumn>
            </ERow>
            <ERow id="n-mix-bottom" :gap="12">
              <EButton focus-key="n-mix-b1" label="底栏确定" variant="primary" />
              <EButton focus-key="n-mix-b2" label="底栏取消" variant="secondary" />
            </ERow>
          </EColumn>
        </section>

      </div>
    </div>
  </EPage>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; padding: 0 57px; box-sizing: border-box; }
.n-head { display: flex; align-items: center; padding: 24px 0; flex-shrink: 0; }
.n-title { font-size: 32px; color: #fff; margin: 0 0 0 24px; }
.n-scroll { position: relative; flex: 1; overflow: hidden; }
.n-track { position: absolute; top: 0; left: 0; width: 100%; }
.n-group { margin-bottom: 40px; }
.n-label { font-size: 22px; color: #7fd; margin-bottom: 16px; }
.tile {
  width: 140px; height: 90px; border-radius: 10px; border: 4px solid transparent;
  background: #2a2f3a; color: #cde; display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.tile.sm { width: 90px; height: 70px; font-size: 20px; }
.tile.wide { width: 220px; height: 70px; }
.tile.hot { border-color: #4af; background: #34506e; }
</style>
