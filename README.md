<a name="tv-kit"></a>

<h1 align="center">tv-kit</h1>

<p align="center">
  面向低版本 WebView（Chromium 53+）的 Vue 3 TV 端开发套件<br/>
  遥控器方向键空间导航焦点系统 + TV 基础组件库
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@chancestv/tv-focus"><img src="https://img.shields.io/npm/v/@chancestv/tv-focus?label=tv-focus" alt="tv-focus version"></a>
  <a href="https://www.npmjs.com/package/@chancestv/tv-ui"><img src="https://img.shields.io/npm/v/@chancestv/tv-ui?label=tv-ui" alt="tv-ui version"></a>
  <img src="https://img.shields.io/badge/target-Chromium%2053%2B-blue" alt="target chromium 53">
  <img src="https://img.shields.io/badge/Vue-3.x-42b883" alt="vue 3">
  <img src="https://img.shields.io/badge/license-MIT%20%2B%20MPL--2.0-green" alt="license">
</p>

<p align="center">
  <b>中文</b> · <a href="#english">English</a>
</p>

---

## 解决什么问题

在 Android TV / webOS / Tizen 等 OTT 设备上用 Vue 3 开发，绕不开两道坎，tv-kit 把这两道坎一次性收口：

### 1. 低版本 WebView 兼容

OTT 设备的 WebView 普遍停留在 **Chromium 53** 一带，ES2017+ 语法、新 DOM API 直接报错。常规做法靠消费方接 `@vitejs/plugin-legacy`，但它**默认不转译 `node_modules`**，引入的库照样跑不起来。

tv-kit 在**库侧**就把构建目标锁死 `chrome53` 完成语法降级（`build.target: 'chrome53'`），消费方拿到的就是可直接在 Chromium 53 运行的产物，兼容性闭环，不用你再操心降级。

### 2. 遥控器焦点这件事，本身就是个大坑

TV 没有鼠标、没有触摸，全靠遥控器**上下左右 + 确认/返回**。这意味着：

- 焦点该往哪走，要按**屏幕上元素的几何位置**算，不是 DOM 顺序；
- 页面切换、弹层打开/关闭、列表滚动……每一处都要管「焦点现在在哪、下一步去哪、回来落在哪」；
- KeepAlive 复活、首屏自动聚焦、返回键到底是关弹层还是退路由——全是时序陷阱。

这些坑自己趟一遍，几周就没了。tv-kit 的核心就是**把空间导航焦点系统做成开箱即用**：标记一下哪些元素可聚焦、用布局组件圈一下分区，方向键导航、焦点记忆、弹层焦点隔离、返回键栈，全自动处理。**业务代码里基本不用再手写焦点逻辑。**

---

## 两个包

| 包 | 职责 |
|---|---|
| [`@chancestv/tv-focus`](./packages/tv-focus) | 空间导航焦点系统。纯逻辑、无样式。导航引擎 fork 自 [js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)，外加 Vue 3 适配层（`Focusable` / `FocusSection` / `FocusLayer` 等）。 |
| [`@chancestv/tv-ui`](./packages/tv-ui) | 基于 tv-focus 的 **E 前缀**基础组件库 + 样式 token。业务层只用这一层即可。 |

> **单例约束**：tv-ui 把 tv-focus 声明为 `peerDependency`，`vue` 同样外置，保证整个应用只有一份 spatial-navigation 单例。
>
> **分层约定**：业务层**不直连** tv-focus，统一通过 tv-ui 的组件使用；tv-ui 用 `setupTvFocus()` 收口初始化。

---

## 安装

```bash
# 两个都装；vue 是你项目已有的 peer
pnpm add @chancestv/tv-ui @chancestv/tv-focus
```

样式不经组件 `import`，需手动引入：

```ts
import '@chancestv/tv-ui/style.css'           // 设计 token + 基础样式
import '@chancestv/tv-ui/styles/focusable.css' // 聚焦态样式
```

---

## 快速开始

```ts
// main.ts —— 应用入口调一次，初始化焦点系统 + 透传 OTT 原生遥控按键
import { setupTvFocus } from '@chancestv/tv-ui'
import '@chancestv/tv-ui/style.css'
import '@chancestv/tv-ui/styles/focusable.css'

setupTvFocus('your-native-key-event') // 传入设备原生按键事件名
```

```vue
<!-- 一个页面：EPage 圈页面分区，ERow/EColumn 排布局，EButton 自动可聚焦 -->
<template>
  <EPage>
    <ERow>
      <EButton @click="play">播放</EButton>
      <EButton @click="fav">收藏</EButton>
    </ERow>
  </EPage>
</template>

<script setup lang="ts">
import { EPage, ERow, EButton } from '@chancestv/tv-ui'
</script>
```

方向键导航、首屏聚焦、焦点记忆全部自动生效，无需手写焦点代码。

---

## 组件一览

| 分类 | 组件 | 说明 |
|---|---|---|
| **页面 / 布局** | `EPage` | 页面级 section，桥接 KeepAlive，处理首屏聚焦与页面切换时序 |
| | `ERow` / `EColumn` | 行 / 列布局分区 |
| | `EFocusGroup` | 焦点分组（restrict / enterTo / last-focused 记忆等） |
| | `EFocusable` | 把任意 DOM 节点标记为可聚焦目标 |
| **基础元素** | `EButton` | 可聚焦按钮 |
| | `ECard` | 卡片 |
| | `EImage` | 图片（带加载态） |
| | `EText` | 文本 |
| | `ELoadingSpinner` | 加载指示 |
| **覆盖层** | `EDialog` | 对话框（焦点隔离 + 关闭复焦） |
| | `EDrawer` | 抽屉 |
| | `EToast` | 轻提示 |
| | `EHintDialog` | 提示弹窗 |
| **性能** | `EVirtual` | 虚拟列表（长列表性能优化） |

> 覆盖层组件基于 `FocusLayer` 做焦点隔离与弹层栈管理：弹层打开时焦点锁在层内，返回键优先关最上层弹层而非触发路由后退。

---

## 兼容目标

- 两个库构建产物语法降级到 **Chromium 53**（`build.target: 'chrome53'`，`minify: false`）。
- `tsconfig` 目标 `ES2015`、`strict`。
- 已在 Android TV / webOS / Tizen 等 OTT 设备 WebView 验证。

---

## 本地开发

```bash
pnpm install
pnpm build          # 拓扑顺序构建所有包（tv-focus 先于 tv-ui）
pnpm dev            # 启动 playground 本地联调
pnpm typecheck      # 所有包 vue-tsc --noEmit
```

发布走 tag 触发的 GitHub Actions（npm Trusted Publishing / OIDC）：更新 `CHANGELOG.md` 与两个包版本号 → 打 `v*` tag 并 push → CI 自动校验版本一致性、发布到 npm、创建 GitHub Release。变更记录见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 致谢

- **[luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)** — `@chancestv/tv-focus` 的空间导航核心算法 fork 自此项目（MPL-2.0）。我们做了 TS 化、移除 jQuery 依赖、ESM 化、构建目标降级到 Chromium 53 等改造，主流程算法未改动。详见 [ATTRIBUTION.md](./packages/tv-focus/src/engine/ATTRIBUTION.md)。

---

## 协议

[MIT](./LICENSE) © chances

其中 `packages/tv-focus/src/engine/` 目录（fork 自 js-spatial-navigation 的导航引擎）为 **MPL-2.0**，已保留原始 LICENSE 与作者署名。整体包许可标识：tv-focus 为 `MIT AND MPL-2.0`，tv-ui 为 `MIT`。

<br/>

---

<a name="english"></a>

<p align="center">
  <a href="#tv-kit">中文</a> · <b>English</b>
</p>

## What it solves

Building Vue 3 apps for OTT devices (Android TV / webOS / Tizen) means hitting two walls. tv-kit handles both for you:

### 1. Legacy WebView compatibility

OTT WebViews are commonly stuck around **Chromium 53** — ES2017+ syntax and modern DOM APIs throw outright. The usual fix, `@vitejs/plugin-legacy` on the consumer side, **does not transpile `node_modules` by default**, so imported libraries still break.

tv-kit performs the down-leveling **inside the library** (`build.target: 'chrome53'`). What you consume already runs on Chromium 53 — compatibility is closed-loop, no extra setup on your end.

### 2. Remote-control focus is a genuinely hard problem

A TV has no mouse and no touch — just the remote's **D-pad + OK/Back**. Which means:

- Focus movement follows the **geometric position** of elements on screen, not DOM order;
- Page transitions, overlays opening/closing, list scrolling — every one needs to track "where focus is now, where it goes next, where it lands on return";
- KeepAlive revival, first-paint auto-focus, whether Back closes an overlay or pops the route — all timing traps.

tv-kit's core is making **spatial-navigation focus work out of the box**: mark which elements are focusable, wrap regions with layout components, and D-pad navigation, focus memory, overlay focus isolation, and the Back-key stack are all handled automatically. **You barely write any focus logic in app code.**

## Two packages

| Package | Role |
|---|---|
| [`@chancestv/tv-focus`](./packages/tv-focus) | Spatial-navigation focus system. Pure logic, no styles. Navigation engine forked from [js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation), plus a Vue 3 adapter layer. |
| [`@chancestv/tv-ui`](./packages/tv-ui) | **E-prefixed** base components + style tokens, built on tv-focus. App code only touches this layer. |

> **Singleton constraint**: tv-ui declares tv-focus (and `vue`) as `peerDependency`, ensuring a single spatial-navigation instance app-wide.
>
> **Layering**: app code never imports tv-focus directly — use tv-ui components; tv-ui funnels init through `setupTvFocus()`.

## Install

```bash
pnpm add @chancestv/tv-ui @chancestv/tv-focus
```

Styles are not auto-imported by components:

```ts
import '@chancestv/tv-ui/style.css'
import '@chancestv/tv-ui/styles/focusable.css'
```

## Quick start

```ts
// main.ts — call once at app entry
import { setupTvFocus } from '@chancestv/tv-ui'
import '@chancestv/tv-ui/style.css'
import '@chancestv/tv-ui/styles/focusable.css'

setupTvFocus('your-native-key-event')
```

```vue
<template>
  <EPage>
    <ERow>
      <EButton @click="play">Play</EButton>
      <EButton @click="fav">Favorite</EButton>
    </ERow>
  </EPage>
</template>

<script setup lang="ts">
import { EPage, ERow, EButton } from '@chancestv/tv-ui'
</script>
```

D-pad navigation, first-paint focus, and focus memory all work automatically.

## Components

| Category | Components |
|---|---|
| **Page / Layout** | `EPage`, `ERow`, `EColumn`, `EFocusGroup`, `EFocusable` |
| **Primitives** | `EButton`, `ECard`, `EImage`, `EText`, `ELoadingSpinner` |
| **Overlays** | `EDialog`, `EDrawer`, `EToast`, `EHintDialog` |
| **Performance** | `EVirtual` (virtual list) |

Overlay components use `FocusLayer` for focus isolation and overlay-stack management: while open, focus is trapped inside the layer, and Back closes the topmost overlay rather than popping the route.

## Compatibility

- Build output down-leveled to **Chromium 53** (`build.target: 'chrome53'`, `minify: false`).
- `tsconfig` target `ES2015`, `strict`.
- Verified on Android TV / webOS / Tizen OTT WebViews.

## Acknowledgements

- **[luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)** — the spatial-navigation core of `@chancestv/tv-focus` is forked from this project (MPL-2.0). We TS-ified it, removed the jQuery dependency, converted it to ESM, and down-leveled the build target to Chromium 53; the core algorithm is unchanged. See [ATTRIBUTION.md](./packages/tv-focus/src/engine/ATTRIBUTION.md).

## License

[MIT](./LICENSE) © chances

The `packages/tv-focus/src/engine/` directory (navigation engine forked from js-spatial-navigation) is **MPL-2.0**, with the original LICENSE and attribution preserved. Package SPDX: tv-focus is `MIT AND MPL-2.0`, tv-ui is `MIT`.
