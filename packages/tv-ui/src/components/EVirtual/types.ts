/**
 * EVirtual 虚拟化容器的 props 类型。
 *
 * 抽到独立文件并导出：泛型组件（generic="T"）的 default export 若引用组件内私有
 * interface，vue-tsc 生成 d.ts 时报 TS4082 并跳过该组件类型。导出公共类型可消除该问题。
 */
import type { Restrict, EnterTo } from '@chancestv/tv-focus'

/**
 * 虚拟化容器 props。一套覆盖纵向列表 / 横向列表 / N 列网格。
 */
export interface EVirtualProps<TItem> {
  /** 数据源 */
  items: TItem[]
  /** 滚动主轴方向 */
  direction?: 'vertical' | 'horizontal'
  /** 单元格宽（px） */
  itemWidth: number
  /** 单元格高（px） */
  itemHeight: number
  /** 垂直于滚动主轴的通道数：纵向滚动=列数，横向滚动=行数。1=纯列表，>1=网格 */
  cross?: number
  /** 主轴可视行/列数（视口大小 = mainVisible 个单元） */
  mainVisible: number
  /** 单元间距（px） */
  gap?: number
  /** 主轴方向 overscan 缓冲行/列数，保证下一步焦点目标已渲染 */
  buffer?: number
  /** 该虚拟容器对应的 section id（唯一） */
  sectionId: string
  /** 子项 focus-key 前缀，子项实际 key = `${focusKeyPrefix}-${index}` */
  focusKeyPrefix?: string
  /** 列表项 key 取值 */
  itemKey?: keyof TItem | ((item: TItem, index: number) => string | number)
  restrict?: Restrict
  enterTo?: EnterTo
}
