# tv-kit 文档站设计

> 日期：2026-06-04
> 目标：用 VitePress 重做 playground 的对外形态——库介绍 + API/组件文档 + 可交互演示，构建为纯静态站点，免费托管到 GitHub Pages 供他人预览。

## 1. 目标与范围

把 `tv-kit` 做成一个组件库官网风格的静态站点：

- **库介绍**：首页讲清楚定位（低版本 WebView TV 端遥控器焦点系统 + 组件库）、解决的问题、核心特性。
- **API/组件文档**：核心指南 + 组件文档。
- **可交互演示**：重点组件页面里嵌真实可操作组件，读者用键盘方向键（模拟遥控器）现场试焦点导航。
- **免费托管**：构建为纯静态文件，GitHub Pages 部署，推送即更新。

**规模档位：精选版**——先立骨架 + 跑通部署链路，重点组件先有交互 demo，长尾组件给 API 速查表，后续增量补。

### 非目标（YAGNI）

- 不替换/删除现有 `playground/`（保留为本地草稿联调场）。
- 不为 15 个组件逐个写 demo（只重点组件）。
- 不引入 Storybook / Histoire（同栈 VitePress 足够，避免重型依赖）。
- 不做国际化文档（README 已中英分离，站点先做中文）。
- 不动 `packages/tv-focus`、`packages/tv-ui` 任何源码。

## 2. 技术选型

| 选型 | 决定 | 理由 |
|---|---|---|
| 站点框架 | **VitePress** | 与库同栈（Vite + Vue3），组件零摩擦挂载；Vue 官网/Element Plus 同款；产物纯静态 |
| demo 插件 | **@vitepress-demo-preview/plugin + /component** | 在 Markdown 里同时渲染「可交互 demo」+「展开源码」，正好满足三合一 |
| 托管 | **GitHub Pages** | 仓库已在 GitHub，与现有 CI 同源，零额外账号；地址 `danweiyuancircle.github.io/chances-tv-kit/` |
| 部署方式 | **GitHub Actions** | 推送 main 自动构建 + 部署，与现有 `release.yml` 并存 |

## 3. 架构与目录

新增一个 **不发布** 的 workspace 包 `docs/`，与 `playground/` 平级。

### 3.1 workspace 注册

`pnpm-workspace.yaml` 新增一行：

```yaml
packages:
  - packages/tv-focus
  - packages/tv-ui
  - playground
  - docs          # 新增
```

### 3.2 docs 目录结构

```
docs/
  package.json                    # 私有包，依赖 vitepress + 两个 workspace 包 + demo 插件
  .vitepress/
    config.ts                     # VitePress 配置：base、导航、侧边栏、demo 插件、Vite 配置
    theme/
      index.ts                    # 扩展默认主题：注册 demo 预览组件、引入 tv-ui 样式、setupTvFocus()
  index.md                        # 首页（hero + features）
  guide/
    introduction.md               # 库介绍：定位、解决的问题、组件清单
    getting-started.md            # 安装、setupTvFocus 初始化、最小示例
    focus-system.md               # 焦点系统原理：section / focusable / layer 栈、分层使用约定、时序陷阱
  components/
    button.md                     # EButton（含 demo）
    layout.md                     # ERow / EColumn（含 demo）
    focus-group.md                # EFocusGroup（含 demo）
    virtual.md                    # EVirtual（含 demo）
    overlay.md                    # EDialog / EDrawer（含 demo）
    card.md                       # ECard（含 demo）
    reference.md                  # 长尾组件 API 速查：EText/EImage/ELoadingSpinner/EToast/EHintDialog/EFocusable
  demos/                          # 可交互 demo 的 .vue 源文件（被 Markdown 引用）
    ButtonBasic.vue
    LayoutNav.vue
    FocusGroupMemory.vue
    VirtualScroll.vue
    OverlayDialog.vue
    CardGrid.vue
```

**demo 组织约定**：每个 demo 是独立 `.vue` 文件放 `docs/demos/`，Markdown 用插件语法引用：

```md
<preview path="../demos/ButtonBasic.vue" title="基础按钮" description="方向键在按钮间移动焦点"></preview>
```

插件渲染为「实时组件 + 可展开源码」，读者既能按方向键试，又能看代码。

### 3.3 重点组件清单（首批配 demo）

| 组件 | demo 体现的焦点能力 |
|---|---|
| EButton | 最基础可聚焦元素 + 焦点态样式 |
| ERow / EColumn | 方向键在行/列间几何导航 |
| EFocusGroup | 分区焦点 + last-focused 记忆 |
| EVirtual | 虚拟列表焦点居中滚动（复用现 playground demo） |
| EDialog / EDrawer | 模态层焦点隔离 + 关闭复焦（FocusLayer 栈） |
| ECard | 内容卡片聚焦态 |

长尾（进 `reference.md` 速查表，暂不配 demo）：EText、EImage、ELoadingSpinner、EToast、EHintDialog、EFocusable。

## 4. 关键集成点

### 4.1 焦点系统在文档站里的初始化

文档站消费 `@chancestv/tv-ui`，demo 要能真实导航，必须：

1. 在 `docs/.vitepress/theme/index.ts` 引入样式：`@chancestv/tv-ui/style.css` + `/styles/*.css`（设计 token、focusable 态）。
2. 调一次 `setupTvFocus()` 初始化 SpatialNavigation 单例（幂等，全站只初始化一次）。
   - **SSR 注意**：VitePress 构建期是 Node 环境无 DOM，`setupTvFocus` 触碰 `window/document` 会报错。必须在 `if (!import.meta.env.SSR)` 守卫内、或主题的 `enhanceApp` 中仅客户端执行。
3. demo 组件直接用 `EPage/ERow/EButton` 等，键盘方向键即可驱动焦点（焦点引擎本身监听 keydown）。

### 4.2 单例约束

文档站对 `@chancestv/tv-focus` 同样要保证单份单例。通过 workspace 依赖 `@chancestv/tv-ui`（已把 tv-focus 声明为 peer），由 pnpm 解析为同一份。docs 的 `package.json` 直接依赖两个 workspace 包 + vue，依赖关系与 playground 一致。

### 4.3 base 路径

GitHub Pages 项目站点路径带仓库名，VitePress `config.ts` 必须设 `base: '/chances-tv-kit/'`，否则资源 404。

### 4.4 Chrome 53 兼容性

文档站本身是给现代浏览器看的展示页，**不需要** chrome53 降级（区别于两个库的 `build.target`）。VitePress 默认产物即可。库代码的兼容性已在库侧 build 闭环，文档站只是消费 dist。

## 5. 部署：GitHub Actions

新增 `.github/workflows/docs.yml`，与 `release.yml` 并存：

- 触发：push 到 `main` 且改动涉及 `docs/**` 或 `packages/**`（组件改了文档要重建）。
- 步骤：checkout → pnpm install → `pnpm build`（先构建两个库 dist，docs 依赖它们）→ `pnpm docs:build` → 上传 `docs/.vitepress/dist` 为 Pages artifact → deploy。
- 权限：`pages: write`、`id-token: write`。
- 仓库 Settings → Pages → Source 设为 GitHub Actions。

## 6. 根脚本

根 `package.json` 新增：

```json
"docs:dev": "pnpm --filter docs dev",
"docs:build": "pnpm --filter docs build",
"docs:preview": "pnpm --filter docs preview"
```

`pnpm dev` 仍指向 playground（本地草稿场不变）。

## 7. 构建顺序依赖

docs 消费 `@chancestv/tv-ui` 的 **dist**（不是源码），所以 docs 构建前必须先 `pnpm build` 出库 dist。CI 里串行保证；本地 `docs:dev` 前需先跑过一次 `pnpm build`（首次提示）。

## 8. 验证标准

1. **本地起站**：`pnpm build && pnpm docs:dev` → 浏览器打开，首页/指南/组件页正常渲染。
2. **交互验证**：组件 demo 页，鼠标点一下聚焦后按方向键，焦点在元素间移动、焦点态样式生效；EDialog demo 打开弹窗焦点进入、关闭复焦。
3. **构建产物**：`pnpm docs:build` 成功，`docs/.vitepress/dist` 有静态文件，无 SSR 报错。
4. **base 正确**：构建产物里资源路径带 `/chances-tv-kit/` 前缀。
5. **部署**：推送后 Actions 绿，访问 `https://danweiyuancircle.github.io/chances-tv-kit/` 站点可打开、demo 可交互。

## 9. 不破坏的约束

- 不动 `packages/` 源码、不改两个库的发布配置。
- 不破坏 tv-focus 单例（docs 依赖关系与 playground 同构）。
- 保留 `playground/` 及 `pnpm dev` 行为不变。
- `docs/` 为 `private: true`，不进 changesets 发布流程。
