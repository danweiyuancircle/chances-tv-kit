import { setupFocus } from '@chancestv/tv-focus'
import { nativeKeyAdapter } from '@chancestv/tv-focus'

/**
 * TV 焦点系统初始化（应用入口调用一次）：
 * 初始化 spatial-navigation + 把 OTT 原生按键事件透传为合成 keydown/keyup。
 * 收口于 tv-ui，使业务壳无需直接依赖 @chancestv/tv-focus。
 */
export function setupTvFocus(nativeKeyEventName: string): void {
  setupFocus({ defaults: { rememberSource: true } })
  nativeKeyAdapter(nativeKeyEventName)
}
