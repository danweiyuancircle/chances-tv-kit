# Changelog

本项目所有重要变更记录于此文件。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

`@chancestv/tv-focus` 与 `@chancestv/tv-ui` 锁步发布，共用同一版本号。

## [Unreleased]

## [0.3.0] - 2026-06-04

### Removed (BREAKING)

- 移除 `@chancestv/tv-ui` 的 `styles/focusable.css`：该文件是一套未被任何组件使用的备选焦点视觉方案（`.focused-default` / `.focused-gradient` / `.focus-border-animated` 等 class 与 `--chances-tv-focus-*` 系列变量），属遗留死代码。组件实际焦点态由 `style.css` 内的 `.tv-focusable.is-focused` 提供，不受影响。
- 不再暴露 `@chancestv/tv-ui/styles/focusable.css` 导出入口；`style.css` 也不再拼入该文件。曾 `import '@chancestv/tv-ui/styles/focusable.css'` 或使用上述 class / `--chances-tv-focus-*`（带后缀，如 `-scale-default` / `-bg-gradient`）变量的消费方需自行迁移。注意 `style.css` 仍保留的 `--chances-tv-focus-shadow`（无后缀，焦点框阴影）不受影响。

## [0.2.0] - 2026-06-04

### Changed (BREAKING)

- `@chancestv/tv-ui` CSS 变量统一命名空间为 `--chances-tv-` 前缀：`--tv-*` → `--chances-tv-*`，`--focus-*` → `--chances-tv-focus-*`（变量值不变，仅重命名）。已覆盖旧变量名做主题定制的消费方需同步改名。

### Fixed

- `@chancestv/tv-ui` 暴露全局重置样式 `./styles/index.css`，修复其既未合进 `style.css`、`exports` 也未暴露导致消费方无从引入的问题；改为独立可选引入，避免侵入式 reset 强制污染宿主页面。
- 去掉 `index.css` 顶部冗余的 `focusable.css` `@import`，并修掉 README / playground 对 `focusable.css` 的重复引入（`style.css` 已含）。

## [0.1.1] - 2026-06-04

### Changed

- 发布流程切换到 npm Trusted Publishing（OIDC），不再依赖 `NPM_TOKEN`，并自动生成 provenance 溯源签名。

### Fixed

- 补全两个包 `package.json` 的 `repository` 字段，修复 OIDC provenance 校验失败（E422）。

## [0.1.0] - 2026-06-04

### Added

- 初始化 `tv-kit` monorepo：TV 焦点系统 + 基础组件库。
- `@chancestv/tv-focus`：面向低版本 WebView（Chromium 53+）的空间导航焦点系统，纯逻辑无样式。
- `@chancestv/tv-ui`：基于 tv-focus 的 E 前缀基础组件与样式 token。
- 接入 tag 触发的 npm 发布 workflow。

[Unreleased]: https://github.com/danweiyuancircle/chances-tv-kit/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/danweiyuancircle/chances-tv-kit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/danweiyuancircle/chances-tv-kit/releases/tag/v0.1.0
