import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// 库构建：语法降级到 chrome53；vue 与 @chancestv/tv-focus 外置为 peerDependency。
// css 不经组件 import，由 build 脚本原样拷贝到 dist/styles，消费方手动引入。
export default defineConfig({
  plugins: [
    vue(),
    dts({ include: ['src'], exclude: ['src/**/*.md'], tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    target: 'chrome53',
    minify: false,
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['vue', '@chancestv/tv-focus'],
    },
  },
})
