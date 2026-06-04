# @chances/tv-ui

面向低版本 WebView（Chromium 53+）的 Vue 3 TV 端基础组件（全部 E 前缀），基于 [`@chances/tv-focus`](https://www.npmjs.com/package/@chances/tv-focus) 的空间导航焦点系统。

## 安装

```bash
pnpm add @chances/tv-ui @chances/tv-focus vue
```

`@chances/tv-focus` 是 peerDependency，确保整个应用只有一份 spatial-navigation 单例。

## 用法

```ts
// 应用入口
import { setupTvFocus } from '@chances/tv-ui'
import '@chances/tv-ui/style.css'   // 全部样式：设计 token + 全局焦点样式 + 组件样式

setupTvFocus('your-native-key-event-name')
```

```vue
<script setup lang="ts">
import { EPage, ERow, EColumn, EButton, EVirtual } from '@chances/tv-ui'
</script>
```

## 组件

- 布局/焦点：`EPage` `EFocusGroup` `ERow` `EColumn` `EFocusable`
- 基础：`EButton` `ECard` `EImage` `EText` `ELoadingSpinner`
- 虚拟列表：`EVirtual`（焦点项滚动居中）
- 浮层：`EDialog` `EDrawer` `EToast` `EHintDialog`
- 初始化：`setupTvFocus`

## 兼容目标

产物语法降级到 `chrome53`。

## License

MIT
