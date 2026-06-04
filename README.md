# tv-kit

面向低版本 WebView（Chromium 53+）的 Vue 3 TV 端开发套件。遥控器方向键空间导航 + TV 基础组件。

## 包

| 包 | 说明 |
|---|---|
| [`@chancestv/tv-focus`](./packages/tv-focus) | TV 空间导航焦点系统（引擎 fork 自 js-spatial-navigation）+ Vue 3 适配层。纯逻辑，无样式。 |
| [`@chancestv/tv-ui`](./packages/tv-ui) | 基于 `@chancestv/tv-focus` 的 TV 基础组件（E 前缀）。 |

`@chancestv/tv-ui` 把 `@chancestv/tv-focus` 作为 peerDependency，确保整个应用只存在一份 spatial-navigation 单例。

## 兼容目标

构建产物语法降级到 `chrome53`。消费方的 `@vitejs/plugin-legacy` 默认不转译 `node_modules`，故本套件在库侧即完成语法降级，可直接在 Chromium 53 WebView 运行。

## 开发

```bash
pnpm install
pnpm build          # 拓扑顺序构建所有包
pnpm dev            # 启动 playground
```

## 发布

```bash
pnpm changeset      # 记录变更
pnpm version        # 更新版本号 + changelog
pnpm release        # 构建 + 发布到 npm
```

## License

MIT（`engine/` 目录为 MPL-2.0，见 [LICENSE](./LICENSE)）。
