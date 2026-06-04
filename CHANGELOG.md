# Changelog

本项目所有重要变更记录于此文件。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

`@chancestv/tv-focus` 与 `@chancestv/tv-ui` 锁步发布，共用同一版本号。

## [Unreleased]

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
