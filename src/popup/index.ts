// src/popup/index.ts
// Popup 入口

import { createApp } from 'vue'
import Popup from './popup.vue'
import './popup.css'

// 创建应用
const app = createApp(Popup)
app.mount('#app')
