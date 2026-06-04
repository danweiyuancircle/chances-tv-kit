<h1 align="center">tv-kit</h1>

<p align="center">
  Vue 3 TV development kit for legacy WebViews (Chromium 53+)<br/>
  Remote-control spatial-navigation focus system + TV base components
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@chancestv/tv-focus"><img src="https://img.shields.io/npm/v/@chancestv/tv-focus?label=tv-focus" alt="tv-focus version"></a>
  <a href="https://www.npmjs.com/package/@chancestv/tv-ui"><img src="https://img.shields.io/npm/v/@chancestv/tv-ui?label=tv-ui" alt="tv-ui version"></a>
  <img src="https://img.shields.io/badge/target-Chromium%2053%2B-blue" alt="target chromium 53">
  <img src="https://img.shields.io/badge/Vue-3.x-42b883" alt="vue 3">
  <img src="https://img.shields.io/badge/license-MIT%20%2B%20MPL--2.0-green" alt="license">
</p>

<p align="center">
  <a href="./README.md">中文</a> · <b>English</b>
</p>

---

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

---

## Two packages

| Package | Role |
|---|---|
| [`@chancestv/tv-focus`](./packages/tv-focus) | Spatial-navigation focus system. Pure logic, no styles. Includes a Vue 3 adapter layer (`Focusable` / `FocusSection` / `FocusLayer`, etc.). |
| [`@chancestv/tv-ui`](./packages/tv-ui) | **E-prefixed** base components + style tokens, built on tv-focus. App code only touches this layer. |

> **Singleton constraint**: tv-ui declares tv-focus (and `vue`) as `peerDependency`, ensuring a single spatial-navigation instance app-wide.
>
> **Layering**: app code never imports tv-focus directly — use tv-ui components; tv-ui funnels init through `setupTvFocus()`.

---

## Install

```bash
pnpm add @chancestv/tv-ui @chancestv/tv-focus
```

Styles are not auto-imported by components:

```ts
import '@chancestv/tv-ui/style.css'        // required: design tokens + focus state + component styles (focusable included)
import '@chancestv/tv-ui/styles/index.css' // optional: global reset (resets host page margin/padding, locks size, scrollbar, etc.)
```

---

## Quick start

```ts
// main.ts — call once at app entry
import { setupTvFocus } from '@chancestv/tv-ui'
import '@chancestv/tv-ui/style.css'

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

---

## Components

| Category | Components |
|---|---|
| **Page / Layout** | `EPage`, `ERow`, `EColumn`, `EFocusGroup`, `EFocusable` |
| **Primitives** | `EButton`, `ECard`, `EImage`, `EText`, `ELoadingSpinner` |
| **Overlays** | `EDialog`, `EDrawer`, `EToast`, `EHintDialog` |
| **Performance** | `EVirtual` (virtual list) |

Overlay components use `FocusLayer` for focus isolation and overlay-stack management: while open, focus is trapped inside the layer, and Back closes the topmost overlay rather than popping the route.

---

## Compatibility

- Build output down-leveled to **Chromium 53** (`build.target: 'chrome53'`, `minify: false`).
- `tsconfig` target `ES2015`, `strict`.
- Verified on Android TV / webOS / Tizen OTT WebViews.

---

## Development

```bash
pnpm install
pnpm build          # topological build (tv-focus before tv-ui)
pnpm dev            # start the playground
pnpm typecheck      # vue-tsc --noEmit across packages
```

Releases run through tag-triggered GitHub Actions (npm Trusted Publishing / OIDC): bump `CHANGELOG.md` and both package versions → push a `v*` tag → CI verifies version consistency, publishes to npm, and creates a GitHub Release. See [CHANGELOG.md](./CHANGELOG.md).

---

## Acknowledgements

- **[luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)** — the spatial-navigation core of `@chancestv/tv-focus` is forked from this project (MPL-2.0). We TS-ified it, removed the jQuery dependency, converted it to ESM, and down-leveled the build target to Chromium 53; the core algorithm is unchanged. See [ATTRIBUTION.md](./packages/tv-focus/src/engine/ATTRIBUTION.md).

---

## License

[MIT](./LICENSE) © chances

The `packages/tv-focus/src/engine/` directory (navigation engine forked from js-spatial-navigation) is **MPL-2.0**, with the original LICENSE and attribution preserved. Package SPDX: tv-focus is `MIT AND MPL-2.0`, tv-ui is `MIT`.
