import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// 库构建：语法降级到 chrome53（消费方 plugin-legacy 默认不转译 node_modules，
// 故兼容性在库侧闭环）；vue 外置为 peerDependency，产物不内联框架。
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
      external: ['vue'],
    },
  },
})
