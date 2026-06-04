import { createApp } from 'vue'
import { setupTvFocus } from '@chancestv/tv-ui'
import '@chancestv/tv-ui/style.css'
import App from './App.vue'

// 初始化 TV 焦点系统；浏览器原生方向键 keydown 直接驱动 spatial-navigation。
setupTvFocus('ott-key')
createApp(App).mount('#app')
