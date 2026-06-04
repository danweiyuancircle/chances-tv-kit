# @chances/tv-focus

面向低版本 WebView（Chromium 53+）的 Vue 3 TV 端空间导航焦点系统。遥控器方向键在 DOM 元素间按几何位置移动焦点，支持 section 分区、模态层栈、记忆焦点。

核心导航引擎 fork 自 [luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)（MPL-2.0）。

## 安装

```bash
pnpm add @chances/tv-focus vue
```

## 用法

```ts
import { setupFocus, nativeKeyAdapter } from '@chances/tv-focus'

// 应用入口调用一次
setupFocus({ defaults: { rememberSource: true } })
// 把 OTT 原生遥控器按键透传为合成 keydown/keyup
nativeKeyAdapter('your-native-key-event-name')
```

```vue
<script setup lang="ts">
import { FocusSection, Focusable } from '@chances/tv-focus'
</script>

<template>
  <FocusSection id="home">
    <Focusable v-slot="{ focused }">
      <div :class="{ active: focused }">item</div>
    </Focusable>
  </FocusSection>
</template>
```

## 导出

- 初始化：`setupFocus` / `nativeKeyAdapter` / `SpatialNavigation`
- 组件：`Focusable` / `FocusSection` / `FocusLayer`
- 组合式：`useFocusable` / `useFocusSection` / `useKeepAliveFocus`
- 工具：`hasOpenLayer`
- 类型：`Direction` / `Restrict` / `EnterTo` / `LeaveFor` / `SectionConfig` 等

## 兼容目标

产物语法降级到 `chrome53`。

## License

MIT AND MPL-2.0
