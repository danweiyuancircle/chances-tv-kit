<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EPage, ERow, EColumn, EButton, EText, ELoadingSpinner, EImage, ECard,
  EFocusable, EVirtual, EDialog, EDrawer, EToast, EHintDialog,
} from '@chancestv/tv-ui'
import { useFocusScroll } from '../composables/useFocusScroll'

const router = useRouter()

const dialog = ref(false)
const drawer = ref(false)
const toast = ref(false)
const hint = ref(false)

const nums = Array.from({ length: 40 }, (_, i) => i + 1)
// picsum 在线随机图（联网 dev 展示用；离线盒子会裂图）
const pic = (seed: number, w: number, h: number) => `https://picsum.photos/seed/p${seed}/${w}/${h}`

const scrollEl = ref<HTMLElement | null>(null)
const { scrollY } = useFocusScroll(scrollEl, 600)
</script>

<template>
  <EPage id="components" default-focus="c-back" class="page">
    <!-- 固定头部 -->
    <div class="c-head">
      <EButton focus-key="c-back" label="返回" size="sm" @enter="router.push({ name: 'Home' })" />
      <h1 class="c-title">基础组件总览（E*）</h1>
    </div>

    <!-- 焦点跟随纵向滚动区 -->
    <div ref="scrollEl" class="c-scroll">
      <div class="c-track" :style="{ transform: `translateY(${-scrollY}px)`, transition: 'transform 0.18s ease' }">

        <!-- EButton -->
        <section class="c-group">
          <div class="c-label">EButton — 变体 / 尺寸 / 禁用</div>
          <ERow id="c-btn" :gap="16">
            <EButton focus-key="c-btn-1" label="primary" variant="primary" />
            <EButton focus-key="c-btn-2" label="secondary" variant="secondary" />
            <EButton focus-key="c-btn-3" label="ghost" variant="ghost" />
            <EButton focus-key="c-btn-4" label="danger" variant="danger" />
            <EButton focus-key="c-btn-5" label="small" size="sm" />
            <EButton focus-key="c-btn-6" label="large" size="lg" />
            <EButton focus-key="c-btn-7" label="disabled" :disabled="true" />
          </ERow>
        </section>

        <!-- EText / ELoadingSpinner -->
        <section class="c-group">
          <div class="c-label">EText（排版） / ELoadingSpinner（加载）</div>
          <ERow id="c-text" :gap="32" align="center">
            <EFocusable focus-key="c-text-1" v-slot="{ focused }">
              <div class="c-tile" :class="{ hot: focused }">
                <EText text="标题文本" :font-size="28" color="#fff" />
                <EText text="这是一段会按行数省略的说明文本，超出两行显示省略号。" :lines="2" :font-size="20" color="#9aa" />
              </div>
            </EFocusable>
            <ELoadingSpinner text="加载中" size="medium" theme="dark" />
            <ELoadingSpinner size="small" theme="dark" />
          </ERow>
        </section>

        <!-- EImage -->
        <section class="c-group">
          <div class="c-label">EImage（懒加载 / objectFit）</div>
          <ERow id="c-img" :gap="16">
            <EImage
              v-for="i in 6" :key="i"
              :focus-key="`c-img-${i}`"
              :src="pic(i, 240, 150)"
              :width="240" :height="150"
              object-fit="cover" :lazy="true"
            />
          </ERow>
        </section>

        <!-- ECard -->
        <section class="c-group">
          <div class="c-label">ECard（图片卡片）</div>
          <ERow id="c-card" :gap="20">
            <ECard
              v-for="i in 6" :key="i"
              :focus-key="`c-card-${i}`"
              :title="`卡片 ${i}`" description="副标题描述"
              :image="pic(i + 10, 220, 150)" :width="200"
            />
          </ERow>
        </section>

        <!-- EFocusable -->
        <section class="c-group">
          <div class="c-label">EFocusable（自定义可聚焦块）</div>
          <ERow id="c-foc" :gap="16">
            <EFocusable
              v-for="i in 6" :key="i"
              :focus-key="`c-foc-${i}`" v-slot="{ focused }"
            >
              <div class="c-tile sq" :class="{ hot: focused }">块 {{ i }}</div>
            </EFocusable>
          </ERow>
        </section>

        <!-- 浮层触发 -->
        <section class="c-group">
          <div class="c-label">浮层：EDialog / EDrawer / EToast / EHintDialog</div>
          <ERow id="c-overlay" :gap="16">
            <EButton focus-key="c-ov-1" label="打开 Dialog" @enter="dialog = true" />
            <EButton focus-key="c-ov-2" label="打开 Drawer" @enter="drawer = true" />
            <EButton focus-key="c-ov-3" label="弹 Toast" @enter="toast = true" />
            <EButton focus-key="c-ov-4" label="打开 HintDialog" @enter="hint = true" />
          </ERow>
        </section>

        <!-- EVirtual 横向 -->
        <section class="c-group">
          <div class="c-label">EVirtual — 横向（焦点居中滚动）</div>
          <EVirtual
            section-id="c-ev-h" direction="horizontal" :items="nums"
            :item-width="140" :item-height="90" :main-visible="6" :gap="14"
            focus-key-prefix="c-evh" v-slot="{ item, focusKey }"
          >
            <EFocusable :focus-key="focusKey" v-slot="{ focused }">
              <div class="c-cell" :class="{ hot: focused }">#{{ item }}</div>
            </EFocusable>
          </EVirtual>
        </section>

        <!-- EVirtual 纵向 -->
        <section class="c-group">
          <div class="c-label">EVirtual — 纵向（焦点居中滚动）</div>
          <EVirtual
            section-id="c-ev-v" direction="vertical" :items="nums"
            :item-width="320" :item-height="64" :main-visible="5" :gap="12"
            focus-key-prefix="c-evv" v-slot="{ item, focusKey }"
          >
            <EFocusable :focus-key="focusKey" v-slot="{ focused }">
              <div class="c-cell c-cell-row" :class="{ hot: focused }">第 {{ item }} 项</div>
            </EFocusable>
          </EVirtual>
        </section>

        <!-- EVirtual 网格 -->
        <section class="c-group">
          <div class="c-label">EVirtual — 网格（cross=4）</div>
          <EVirtual
            section-id="c-ev-g" direction="vertical" :cross="4" :items="nums"
            :item-width="150" :item-height="90" :main-visible="2" :gap="14"
            focus-key-prefix="c-evg" v-slot="{ item, focusKey }"
          >
            <EFocusable :focus-key="focusKey" v-slot="{ focused }">
              <div class="c-cell" :class="{ hot: focused }">#{{ item }}</div>
            </EFocusable>
          </EVirtual>
        </section>
      </div>
    </div>

    <!-- 浮层实例 -->
    <EDialog v-model="dialog" title="这是一个 Dialog" default-focus="dlg-ok">
      <EText text="Dialog 内容区，FocusLayer 已自动隔离背景焦点。" :font-size="22" color="#ddd" />
      <template #footer>
        <EButton focus-key="dlg-ok" variant="primary" label="知道了" @enter="dialog = false" />
      </template>
    </EDialog>

    <EDrawer v-model="drawer" placement="right" title="右侧抽屉" default-focus="drw-ok">
      <EText text="Drawer 内容。" :font-size="22" color="#ddd" />
      <template #footer>
        <EButton focus-key="drw-ok" variant="primary" label="关闭" @enter="drawer = false" />
      </template>
    </EDrawer>

    <EHintDialog v-model="hint" message="这是一个提示弹框，确认即关闭。" @confirm="hint = false" />

    <EToast v-model="toast" message="操作成功" placement="center" :duration="1500" />
  </EPage>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; padding: 0 57px; box-sizing: border-box; }
.c-head { display: flex; align-items: center; padding: 24px 0; flex-shrink: 0; }
.c-title { font-size: 32px; color: #fff; margin: 0 0 0 24px; }
.c-scroll { position: relative; flex: 1; overflow: hidden; }
.c-track { position: absolute; top: 0; left: 0; width: 100%; }
.c-group { margin-bottom: 36px; }
.c-label { font-size: 22px; color: #7fd; margin-bottom: 16px; }
.c-tile {
  width: 360px; min-height: 110px; padding: 16px; box-sizing: border-box;
  background: #20242c; border-radius: 12px; border: 4px solid transparent;
}
.c-tile.sq { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; color: #cfe; font-size: 24px; }
.c-tile.hot { border-color: #4af; }
.c-cell {
  width: 100%; height: 100%; border-radius: 10px; border: 4px solid transparent;
  background: #2a2f3a; color: #cde; display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.c-cell.hot { border-color: #4af; background: #34506e; }
.c-cell-row { justify-content: flex-start; padding-left: 20px; box-sizing: border-box; font-size: 20px; }
</style>
