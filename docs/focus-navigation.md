# 焦点处理与查找逻辑

本文说明 `@chancestv/tv-focus` 引擎（v0.4.0+）按方向键时**如何找下一个焦点**。打分核心为 [Android TV `FocusFinder`](https://cs.android.com/android/platform/superproject/+/main:frameworks/base/core/java/android/view/FocusFinder.java) 加权距离模型 + section 级方向剪枝。

源码：`packages/tv-focus/src/engine/spatial-navigation.ts`

---

## 0. 两个基本概念

| 概念 | 是什么 | 谁注册 | DOM 标记 |
|---|---|---|---|
| **section（焦点区）** | 导航的分组 / 剪枝单位，本身不持有焦点 | `useFocusSection`（EPage / ERow / EColumn / EFocusGroup） | 配置存于引擎 `_sections[id]`；项上写 `data-sn-section="<id>"`，区根 DOM 带 `data-sn-section-root="<id>"` |
| **focusable（可聚焦项）** | 真正持有焦点的元素 | `useFocusable`（EButton / EFocusable） | `tabindex=-1` + `data-sn-section` + `data-focus-key` |

- 一个 focusable 只属于**一个**最近的 section（`useFocusable` 用 `inject` 取最近的 `useFocusSection`，嵌套时内层覆盖外层）。
- 嵌套场景下，**外层容器 section 自己 0 个项**（项都写最内层叶子 section 的 id），项全归**叶子 section**。
- 所有 section 在 `_sections` 中**扁平**存放，无父子关系记录；嵌套关系只体现在 DOM 几何上。

---

## 1. 入口：按键 → onKeyDown → focusNext

`onKeyDown`：

1. 方向键 keyCode（37/38/39/40）→ `direction` = `'left'|'up'|'right'|'down'`。
2. 取当前焦点 `currentFocusedElement`；无焦点则聚焦 `_lastSectionId` 记忆项或默认 section。
3. `currentSectionId = getSectionId(elem)`（按 `data-sn-section` 匹配）。
4. 派发 `sn:willmove`（可 `preventDefault` 拦截）。
5. 调 **`focusNext(direction, currentFocusedElement, currentSectionId)`** —— 核心。

> `SpatialNavigation.move(dir)` 是等价 API 入口，走同一 `focusNext`。

---

## 2. focusNext：两段式查找 + section 级剪枝

每次按键先收集所有 section 的可导航项：

```
for (id in _sections):
  sectionNavigableElements[id] = getSectionNavigableElements(id)   // selector 命中 + isNavigable 过滤
  allNavigableElements += 上述
config = GlobalConfig + 当前 section 配置
```

按当前 section 的 `restrict` 分流：

### 2.1 restrict = 'self-only' / 'self-first' —— 先在本 section 内找

```
next = navigate(currentFocused, direction, 本section项（排除自己）, config)
```

- 用 **Android 打分**（§4）在本 section 候选里选 best。
- `self-only`：到此为止，找不到就失败（焦点锁死在区内，**拦截焦点不出区**）。
- `self-first`：本区没有 → 继续 2.2 跨区。

### 2.2 self-first 跨区 —— 先 section 级方向剪枝，再打分

```
prunedCandidates = filterCandidatesByDirection(currentFocused, direction, sectionNavigableElements, currentSectionId)
若 prunedCandidates 为空 → 回退全量（exclude 本section后的 allNavigableElements）  // 兜底，不死焦点
next = navigateWithinScrollScope(currentFocused, direction, prunedCandidates, config, true)
```

**`filterCandidatesByDirection`（section 级方向剪枝）**：
- 对每个 section（跳过当前 section、跳过 0 项的容器 section）：
  - 求该 section 所有项的**并集包围盒**（union bbox）。
  - 用 Android `isCandidate(源焦点, bbox, direction)` 判方向：**整体处于反方向的 section 整片剪掉**（如按左时整个在右侧的区），其项不进入后续几何计算。
- 保留的 section 的项拍平为候选。
- **只剪「纯反方向」**：在方向上有推进的 section 都保留，beam 内/外的细分留给项级 `beamBeats`（§4.3）。

### 2.3 restrict = 'none' —— 全局单平面

无 section 边界，候选 = 全页除自己外所有项，直接 `navigateWithinScrollScope`（不剪枝）。

---

## 3. 滚动容器感知：navigateWithinScrollScope

`navigate` 外包一层，处理跨可滚容器：

```
targetScope = getScrollScope(target)        // 向上找第一个 overflow≠visible 的祖先（auto/scroll/hidden/clip）
候选分两组：inScope（与焦点同滚动容器） / outScope（容器外，如固定页头）
两组都非空 → 先在 inScope 找，找不到才 outScope
否则 → 直接对全部候选 navigate
```

目的：跨区优先留在同一可滚容器内（哪怕候选已滚出视口），不越界跳到容器外固定元素。`getScrollScope` 结果用 `WeakMap` 缓存（容器关系稳定，避免每次按键 walk DOM + getComputedStyle）。

---

## 4. navigate：项级打分（Android FocusFinder 模型）

`navigate(target, direction, candidates, config, preferNearest)`。`preferNearest` 入参保留兼容，Android 模型下不再控制分层。

### 4.1 第一步：过 isCandidate 方向门

逐候选转 `getRect`，过 `snIsCandidate(targetRect, rect, direction)`，不在方向上的直接淘汰（**不参与后续计算**）。`config.straightOnly` 时额外要求 `snBeamsOverlap`（必须 beam 内）。

`isCandidate`（以 left 为例）：候选要「整体更靠左」——
```
left:  (src.right > dest.right || src.left >= dest.right) && src.left > dest.left
```
四方向对称。注意 `src.left > dest.left`：正下方同列同宽元素（left 边缘相同）会被 left 排除（它属 down 的候选），符合直觉。

### 4.2 第二步：两两 isBetterCandidate 选 best

```
best = rects[0]
for k in 1..n: if isBetterCandidate(direction, target, rects[k], best): best = rects[k]
```

`isBetterCandidate(dir, src, r1, r2)`（r1 是否比 r2 更优）：
1. r1 非候选 → false；r2 非候选 → true（r1 胜）
2. `beamBeats(r1, r2)` → true（r1 凭 beam 胜）
3. `beamBeats(r2, r1)` → false（r2 凭 beam 胜）
4. 否则比加权距离：`weighted(r1) < weighted(r2)`

### 4.3 beam（光束）优先

**beam = 当前焦点在按键方向上的投影通道**。`beamsOverlap`：
- left/right：候选与焦点**垂直**区间有交叠（同行附近）
- up/down：候选与焦点**水平**区间有交叠（同列附近）

`beamBeats(src, r1, r2)`：r1 在 beam 内、r2 在 beam 外 → r1 胜（次轴对齐的优先于斜向的）。left/right 方向 beam 内无条件优先；up/down 再比主轴距离细分。

### 4.4 加权距离

```
majorAxisDistance  = 主轴（按键方向）边到边距离，max(0, …)
minorAxisDistance  = 次轴中心偏移 |center 差|
weightedDistance   = 13 × major² + minor²
```

主轴权重 **13 倍** —— 强烈偏向「沿按键方向最近」，次轴对齐为次要修正。后果：**同行/同列直邻恒胜「斜向但边缘更近」的元素**（这正是修掉「更宽的斜向元素靠边缘贴近抢焦点」那个 bug 的根本）。

### 4.5 rememberSource（复焦）

`config.rememberSource` 且 `previous` 命中（上次从该方向的反方向来）时：若 `previous.target` 仍是合法候选且不被 best 严格击败，则复焦它。保留「左右往返不抖动」语义（Android 原生无此机制，此处嫁接）。

---

## 5. 选中之后：进入目标 section

`navigate` 返回 `next` 后：

1. 记 `previous`（供反向 rememberSource）。
2. `nextSectionId = getSectionId(next)`。
3. **若跨了 section**：
   - 先看来源 section 的 `leaveFor[direction]`（显式跳转规则），命中则照它走。
   - 否则按**目标 section 的 `enterTo`** 决定真正落点：
     - `last-focused`（ERow/EColumn 默认）：回目标区**上次焦点项** → 否则 defaultElement。
     - `default-element`：总是 defaultElement。
   - 即：几何选出的 `next` 决定「进哪个 section」，但**进去落哪个项**可能被 `enterTo` 覆盖（回到该区记忆位）。
4. `focusElement(next, …)`：blur 旧、focus 新，派发 `sn:willunfocus/unfocused/willfocus/focused`，更新 `lastFocusedElement` / `_lastSectionId`。
5. 全程没找到 → `sn:navigatefailed`，焦点不动。

---

## 6. 一次完整查找的决策流

```
按左键
└─ focusNext(left, 当前项, 当前section)
   ├─ data-sn-left 显式跳转？有 → 照走
   ├─ 1) section 内 navigate(候选=本section项, Android 打分)
   │       过 isCandidate 门 → 两两 isBetterCandidate（beam 优先 + 13·major²+minor²）选 best
   │       有结果 → 进 §5
   ├─ 2) 没有 且 self-first → section 级方向剪枝
   │       filterCandidatesByDirection：剪掉整体在反方向的 section（剪光则回退全量）
   │       → navigateWithinScrollScope（inScope 优先）→ navigate（同上 Android 打分）
   │       有结果 → 进 §5（enterTo 可能覆盖落点）
   └─ 3) 仍无 → leaveFor 兜底 / navigatefailed（焦点不动）
```

---

## 7. 控制焦点行为的 props（section 配置）

ERow / EColumn / EFocusGroup / EPage 透传给 `useFocusSection`：

| prop | 取值 | 作用 |
|---|---|---|
| `restrict` | `self-first`（默认） | 先区内找，找不到才出区 |
| | `self-only` | **焦点锁死在区内，方向键到边界不动**（拦截不出去） |
| | `none` | 无边界，全局平面 |
| `enterTo` | `last-focused`（默认） | 进入本区时回上次焦点项 |
| | `default-element` | 进入时总是落 `defaultElement` |
| `leaveFor` | `{left/right/up/down: selector}` | 给某方向指定显式出口（优先级最高） |
| `defaultElement` | selector | 默认聚焦项 |
| `straightOnly` | `true` | 只接受 beam 内候选（严格同行/同列） |

> 锁焦点常见组合：`restrict="self-only"`（彻底锁）；或 `self-only` + `leaveFor` 指定唯一出口；或返回键单独处理离开。

---

## 8. 性能：剪枝层级

OTT 盒子 CPU 弱，引擎按层级缩小每次按键参与几何计算的候选集：

1. **restrict 分区**：默认只在当前 section 内找，绝大多数按键不出本区。
2. **section 级方向剪枝**（`filterCandidatesByDirection`）：跨区时整体在反方向的 section 整片排除，其项不算 `getRect`。
3. **isCandidate 方向门**：项级再过一道，反方向项不参与加权距离。
4. **滚动容器分组 + WeakMap 缓存**：同容器优先，元素→容器映射缓存。

结果：每次方向键真正参与比较的元素压到很小一撮，Chromium 53 级真机也跟手。

---

## 附：与上游 / Android 的关系

- section 框架（注册、`restrict`/`enterTo`/`leaveFor` 边界策略、滚动容器感知）fork 自 [luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)（MPL-2.0）。
- 候选打分核心（§4）自 v0.4.0 重写为 Android TV `FocusFinder` 加权距离模型，移除上游的 9 宫格 `partition` / 分层 `prioritize`。
- section 级方向剪枝（§2.2）为本项目新增，是 Android `isCandidate` 思路从项级提到 section 级。
- 详见 [ATTRIBUTION.md](../packages/tv-focus/src/engine/ATTRIBUTION.md)。
