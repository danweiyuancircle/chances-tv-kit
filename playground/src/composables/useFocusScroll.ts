import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * 页面级焦点滚动跟随。
 *
 * playground 自带的轻量实现：监听容器内冒泡的 sn:focused 事件，
 * 把当前聚焦元素垂直滚进视口中部。库的 EVirtual 自带行内滚动，
 * 这里只负责"整页纵向"跟随，覆盖普通 ERow/EColumn 堆叠超出视口的情况。
 *
 * 不进库——属于 demo 页面自身职责。
 *
 * @param scrollEl 滚动视口元素（overflow: hidden + 内部 track translateY）
 * @param viewportH 视口高度（px），聚焦元素尽量落在中线
 */
export function useFocusScroll(scrollEl: Ref<HTMLElement | null>, viewportH: number) {
  const scrollY = ref(0)

  const onFocused = (evt: Event) => {
    const el = evt.target as HTMLElement
    const host = scrollEl.value
    if (!host) return

    const track = host.firstElementChild as HTMLElement | null
    if (!track) return

    // 元素相对 track 顶部的偏移
    const elTop = el.getBoundingClientRect().top - track.getBoundingClientRect().top
    const elH = el.offsetHeight
    // 目标：把元素中心对到视口中线
    let target = elTop + elH / 2 - viewportH / 2

    // 夹在 [0, maxScroll]
    const maxScroll = Math.max(0, track.scrollHeight - viewportH)
    if (target < 0) target = 0
    if (target > maxScroll) target = maxScroll

    scrollY.value = target
  }

  onMounted(() => {
    scrollEl.value?.addEventListener('sn:focused', onFocused, true)
  })
  onUnmounted(() => {
    scrollEl.value?.removeEventListener('sn:focused', onFocused, true)
  })

  return { scrollY }
}
