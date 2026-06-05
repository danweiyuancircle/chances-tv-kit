import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署到项目子路径 /chances-tv-kit/，本地 dev 用根路径 /。
// 由环境变量 PAGES_BASE 控制（CI 部署时注入），未设则为 '/'。
const base = process.env.PAGES_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [vue()],
  server: { port: 5180 },
})
