<template>
  <FocusSection
    :id="sectionId"
    :restrict="restrict"
    :enter-to="enterTo"
    tag="div"
    class="e-virtual"
    :style="containerStyle"
  >
    <div ref="trackRef" class="e-virtual__track" :style="trackStyle">
      <div
        v-for="cell in rendered"
        :key="cell.key"
        class="e-virtual__cell"
        :style="cell.style"
      >
        <slot :item="cell.item" :index="cell.index" :focusKey="cell.focusKey" />
      </div>
    </div>
  </FocusSection>
</template>

<script setup lang="ts" generic="T">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { FocusSection } from '@chancestv/tv-focus'
import type { EVirtualProps } from './types'

/**
 * 统一虚拟化容器：窗口化渲染（只渲染可视 + buffer 的节点），
 * 一套组件覆盖三种布局：
 * - direction='vertical' + cross=1   → 纵向列表
 * - direction='horizontal' + cross=1 → 横向列表
 * - direction='vertical' + cross=N   → N 列网格（横向网格则 horizontal + cross=N）
 *
 * 焦点跟随：监听子项 sn:focused，把聚焦行/列滚动到视口主轴中央（首尾自动贴边，
 * 不留空白）；buffer≥1 保证移动方向上的下一行/列始终已渲染，遥控器单步移动不会
 * 落到未渲染元素上。
 *
 * 定位用绝对坐标（fixed itemWidth/itemHeight），不依赖 CSS gap（Chromium 53 不支持）。
 * props 类型见 ./types 的 EVirtualProps。
 */
const props = withDefaults(defineProps<EVirtualProps<T>>(), {
  direction: 'vertical',
  cross: 1,
  gap: 16,
  buffer: 2,
  restrict: 'self-first',
  enterTo: 'last-focused',
  focusKeyPrefix: undefined,
})

const isVertical = computed(() => props.direction === 'vertical')
const keyPrefix = computed(() => props.focusKeyPrefix ?? `evirtual-${props.sectionId}-item`)

// 主轴单元步长（含间距）；交叉轴单元步长
const mainStep = computed(() => (isVertical.value ? props.itemHeight : props.itemWidth) + props.gap)
const crossStep = computed(() => (isVertical.value ? props.itemWidth : props.itemHeight) + props.gap)

// 主轴总行数（每 cross 个为一行/一列）
const totalLines = computed(() => Math.ceil(props.items.length / props.cross))
// 视口主轴 px / 交叉轴 px
const viewportMainPx = computed(() => props.mainVisible * mainStep.value - props.gap)
const viewportCrossPx = computed(() => props.cross * crossStep.value - props.gap)
const totalMainPx = computed(() => totalLines.value * mainStep.value - props.gap)
const maxOffset = computed(() => Math.max(0, totalMainPx.value - viewportMainPx.value))

const scrollOffset = ref(0)
const trackRef = ref<HTMLElement | null>(null)

function resolveKey(item: T, index: number): string | number {
  if (typeof props.itemKey === 'function') return props.itemKey(item, index)
  if (props.itemKey && item && typeof item === 'object') {
    const v = (item as Record<string, unknown>)[props.itemKey as string]
    if (v != null) return v as string | number
  }
  return index
}

// 当前渲染窗口内的单元
const rendered = computed(() => {
  const step = mainStep.value
  const firstVisible = Math.floor(scrollOffset.value / step)
  const startLine = Math.max(0, firstVisible - props.buffer)
  const endLine = Math.min(
    totalLines.value - 1,
    Math.ceil((scrollOffset.value + viewportMainPx.value) / step) + props.buffer,
  )

  const cells: Array<{
    key: string | number
    index: number
    item: T
    focusKey: string
    style: Record<string, string>
  }> = []

  for (let line = startLine; line <= endLine; line++) {
    for (let lane = 0; lane < props.cross; lane++) {
      const index = line * props.cross + lane
      if (index >= props.items.length) break
      const mainPos = line * step
      const crossPos = lane * crossStep.value
      cells.push({
        key: resolveKey(props.items[index], index),
        index,
        item: props.items[index],
        focusKey: `${keyPrefix.value}-${index}`,
        style: {
          position: 'absolute',
          width: `${props.itemWidth}px`,
          height: `${props.itemHeight}px`,
          top: `${isVertical.value ? mainPos : crossPos}px`,
          left: `${isVertical.value ? crossPos : mainPos}px`,
        },
      })
    }
  }
  return cells
})

const containerStyle = computed(() => ({
  position: 'relative' as const,
  overflow: 'hidden',
  width: `${isVertical.value ? viewportCrossPx.value : viewportMainPx.value}px`,
  height: `${isVertical.value ? viewportMainPx.value : viewportCrossPx.value}px`,
}))

const trackStyle = computed(() => ({
  position: 'absolute' as const,
  top: '0',
  left: '0',
  transform: isVertical.value
    ? `translateY(${-scrollOffset.value}px)`
    : `translateX(${-scrollOffset.value}px)`,
  transition: 'transform 0.18s ease',
}))

/** 把指定主轴行/列滚动到视口主轴中央；首尾行被 clamp 自动贴边，不留空白 */
function ensureLineVisible(line: number) {
  const step = mainStep.value
  // 单元主轴尺寸（步长扣掉间距），用于求行中心
  const itemMainPx = step - props.gap
  // 该行中心对齐视口中心：行中心 - 半个视口
  const next = line * step + itemMainPx / 2 - viewportMainPx.value / 2
  scrollOffset.value = Math.max(0, Math.min(next, maxOffset.value))
}

function onSnFocused(e: Event) {
  const target = e.target as HTMLElement | null
  const key = target?.getAttribute('data-focus-key')
  if (!key) return
  const prefix = keyPrefix.value + '-'
  if (!key.startsWith(prefix)) return
  const index = parseInt(key.slice(prefix.length), 10)
  if (Number.isNaN(index)) return
  ensureLineVisible(Math.floor(index / props.cross))
}

onMounted(() => {
  trackRef.value?.addEventListener('sn:focused', onSnFocused, true)
})
onUnmounted(() => {
  trackRef.value?.removeEventListener('sn:focused', onSnFocused, true)
})

// 数据变短导致偏移越界时回拉
watch(maxOffset, (max) => {
  if (scrollOffset.value > max) scrollOffset.value = max
})

defineExpose({ scrollOffset, ensureLineVisible })
</script>

<style scoped>
.e-virtual {
  position: relative;
}
.e-virtual__cell {
  box-sizing: border-box;
}
</style>
