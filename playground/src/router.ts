import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * playground 路由表。
 *
 * 用 hash 模式：无需后端配 history fallback，盒子里直接开文件也能跑。
 * 三页：导航入口 / 组件总览 / 嵌套布局。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/components',
      name: 'Components',
      component: () => import('./views/ComponentsView.vue'),
    },
    {
      path: '/nested',
      name: 'Nested',
      component: () => import('./views/NestedView.vue'),
    },
  ],
})

export default router
