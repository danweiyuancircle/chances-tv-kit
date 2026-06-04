# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

`tv-kit` 是面向**低版本 WebView（Chromium 53+，Android TV / webOS / Tizen 等 OTT 设备）**的 Vue 3 TV 端开发套件。核心是遥控器方向键的**空间导航焦点系统** + 一套 TV 基础组件。pnpm monorepo，两个发布包 + 一个 playground。

## 常用命令

```bash
pnpm install
pnpm build          # 拓扑顺序构建所有包（tv-focus 先于 tv-ui）
pnpm dev            # 启动 playground（vite，仅 playground 包）
pnpm typecheck      # 所有包 vue-tsc --noEmit

# 单包构建 / 类型检查
pnpm --filter @chancestv/tv-focus build
pnpm --filter @chancestv/tv-ui typecheck
```

发布走 changesets：`pnpm changeset` 记录变更 → `pnpm version` 更新版本号+changelog → `pnpm release`（build + publish）。

**测试现状**：仓库已配置 TDD 规则（`.claude/rules/dwy-tdd-development.md`、AGENTS.md），但尚未接入测试框架（无 vitest，无 `*.test.ts`，无 `TEST_CASES.md`）。新增功能前需先搭测试基础设施，再按规则先写测试。

## 架构主线

三个 workspace（`pnpm-workspace.yaml`）：

| 包 | 角色 |
|---|---|
| `packages/tv-focus`（`@chancestv/tv-focus`）| 空间导航焦点系统。纯逻辑无样式。`src/engine/` fork 自 [luke-chang/js-spatial-navigation]，**MPL-2.0**（其余 MIT）。 |
| `packages/tv-ui`（`@chancestv/tv-ui`）| 基于 tv-focus 的 E 前缀基础组件 + 样式 token。 |
| `playground` | 本地联调，依赖两个 workspace 包。不发布。 |

**单例约束（关键）**：`@chancestv/tv-ui` 把 `@chancestv/tv-focus` 声明为 **peerDependency**，保证整个应用只存在一份 spatial-navigation 单例。`vue` 同样外置为 peer。改依赖关系时勿破坏这一点。

**分层使用约定**：业务层**禁止直连** `@chancestv/tv-focus` 入口，应通过 `@chancestv/tv-ui` 的 `EPage` / `ERow` / `EColumn` / `EFocusGroup` 等组件使用。tv-ui 通过 `setupTvFocus()` 收口初始化，使业务壳无需直接依赖 tv-focus。

### 焦点系统数据流

1. **初始化**：应用入口调一次 `setupTvFocus(nativeKeyEventName)`（`tv-ui/src/setup.ts`）→ 内部 `setupFocus()` 初始化 SpatialNavigation 单例（幂等）+ `nativeKeyAdapter()` 把 OTT 原生遥控按键事件透传为合成 keydown/keyup。
2. **分区**：`FocusSection` / `useFocusSection` 注册 section（`restrict` / `enterTo` / `last-focused` 记忆等配置）。`EPage` = 页面级 section + KeepAlive 桥接。
3. **可聚焦元素**：`Focusable` / `useFocusable` 标记 DOM 节点为导航目标，按几何位置接收方向键焦点。
4. **模态层栈**：`FocusLayer` 挂载/卸载时 `pushLayer()`/`popLayer()`（`layer-stack.ts` 全局计数器）。`hasOpenLayer()` 供上层 Back 键逻辑判断「是否有打开的弹层」，有则把返回键交给最上层弹层而非触发路由后退。`EDialog`/`EDrawer` 共用 `useOverlay` + `FocusLayer` 做焦点隔离与关闭复焦。

### 易踩的时序陷阱（改焦点相关代码前务必读）

- **KeepAlive + 首屏聚焦**：`useEPage.ts` 同时挂 `onMounted` 和 `onActivated`——KeepAlive 首次挂载子树时 EPage 作为孙组件的 `onActivated` 不一定触发，会漏首屏聚焦；onActivated 覆盖复活返回。两者都触发时重复聚焦同元素无副作用，**勿删其一**。
- **页面切换 pause/resume 同帧冲突**：离开页 `onDeactivated → pause()` 与新页激活同帧执行会关停 SN（进页后遥控器无响应）。`useEPage` 用 `nextTick` 后再 `resume()` + `focus()` 兜底，保证可见页 SN 必为活动态。

## 兼容性约束（不可妥协）

- 两个库的 `vite.config.ts` 均 **`build.target: 'chrome53'`**，在库侧完成语法降级（消费方 `@vitejs/plugin-legacy` 默认不转译 `node_modules`，故兼容性在库侧闭环）。`minify: false`。写代码避免依赖 Chrome 53+ 才有的 API/语法。
- `tsconfig.base.json`：`target: ES2015`、`strict`、`noUnusedLocals`/`noUnusedParameters`（有未用 import/变量会编译失败）。

## 组件与样式约定

- 所有组件 **E 前缀**，纯基础组件（无业务、无项目资产）。组件目录结构 `components/EXxx/index.vue`，复杂组件可拆 `types.ts` / 内部 composable。
- 组件逻辑较重时抽到 `composables/`（如 `useEPage` / `useOverlay` / `useFocusLockedKeys`），组件薄壳调用。**业务层不直接 import 这些内部 composable**，只用组件。
- 样式 **不经组件 `import`**：CSS 由 tv-ui 的 build 脚本原样拷到 `dist/styles`，消费方手动引入。`@chancestv/tv-ui/style.css` 是**必引**（build 脚本 `cat` 拼接 tokens + 组件 css）；`@chancestv/tv-ui/styles/index.css` 是**可选**的侵入式全局 reset（重置宿主页面 margin/padding、锁尺寸、滚动条），独立暴露不并入 style.css。CSS 变量统一 `--chances-tv-` 前缀。改样式打包逻辑看 tv-ui `package.json` 的 `build` 脚本与 `exports`。

## Release

两个发布包 **锁步发版，共用同一版本号**（CI 强制校验两包 `package.json` 版本与 tag 一致）。发布由**推送 `v*` tag 触发 GitHub Actions**（`.github/workflows/release.yml`）自动完成，本地不跑 publish；npm 用 OIDC Trusted Publishing（无 `NPM_TOKEN`，自动生成 provenance）。

### 包列表

| 包名 | scope | 版本文件 |
|------|-------|---------|
| `@chancestv/tv-focus` | tv-focus | `packages/tv-focus/package.json` |
| `@chancestv/tv-ui` | tv-ui | `packages/tv-ui/package.json` |

- 测试命令：（尚未接入测试框架，见上文「测试现状」）
- 构建命令：`pnpm -r build`（CI 执行；本地验证同此）
- 发布命令：`pnpm -r publish --access public --no-git-checks`（**仅 CI 执行**，private 包 playground 自动跳过）
- 验证命令：`npm view @chancestv/tv-ui version` / `npm view @chancestv/tv-focus version`

### 发版步骤

1. 两包 `package.json` `version` 同步 bump 到目标版本（破坏性变更在 0.x 阶段升 minor）。
2. 根 `CHANGELOG.md` 新增 `## [x.y.z] - 日期` 段（Keep a Changelog 格式，`scripts/extract-changelog.mjs` 据此提取作 GitHub Release 正文）。
3. 本地预演 CI 校验：两包版本一致 + `node scripts/extract-changelog.mjs <version>` 能取到段落 + `pnpm -r build` 通过。
4. commit（`chore: 发布 v<version>`）→ 打 tag `v<version>` → `git push origin main` 与 `git push origin v<version>`（lightweight tag，需显式推）。
5. CI 跑完后 `npm view` 验证。

### Tag 命名

`v<version>`，如 `v0.2.0`（两包同号，故用统一 `v*` 而非 per-package tag）。

### CHANGELOG

手写根 `CHANGELOG.md`（无自动生成工具）。CI 的 `scripts/extract-changelog.mjs` 按 `## [version]` 段抽取，找不到该段则发布中止。

## Git Commit Scope

单模块变更必须带 scope，跨模块省略。枚举值：

- `tv-focus` — `packages/tv-focus`
- `tv-ui` — `packages/tv-ui`
- `playground` — `playground`
- 跨包 / 仓库级（CI、根配置、文档站等）→ 省略 scope

## 注意

- 部分内部 JSDoc 仍残留旧命名（`@shell/core`、`@shell/tv-ui`、`@shell/core/focus`），实际发布包名为 `@chancestv/*`。改注释时统一到 `@chancestv/*`，勿被旧名误导。
- 改 `src/engine/` 下文件时注意它是 MPL-2.0 fork，保留 `ATTRIBUTION.md` / `LICENSE` 归属。

[luke-chang/js-spatial-navigation]: https://github.com/luke-chang/js-spatial-navigation
