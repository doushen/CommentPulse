// 注入到页面的Vue应用入口
console.log('CommentPulse: inject.js loaded, initializing Vue app')

// 直接导入所有需要的模块（让 Vite 打包到一起）
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import App from '../App.vue'

// 从 DOM 元素获取配置（避免内联脚本）
function getConfig() {
  const configElement = document.getElementById('commentpulse-config')
  if (!configElement) {
    console.error('CommentPulse: Config element not found')
    return null
  }
  
  return {
    cssUrl: configElement.getAttribute('data-css-url') || '',
    runtimeId: configElement.getAttribute('data-runtime-id') || ''
  }
}

const config = getConfig()
if (!config || !config.cssUrl) {
  console.error('CommentPulse: Config not found or invalid, cannot initialize')
} else {
  const { cssUrl } = config

  // 初始化应用
  try {
    // 创建Shadow DOM隔离样式
    const shadowHost = document.createElement('div')
    shadowHost.id = 'commentpulse-shadow-host'
    document.body.appendChild(shadowHost)
    console.log('CommentPulse: Shadow host created')

    const shadowRoot = shadowHost.attachShadow({ mode: 'open'})

    // 创建容器
    const appContainer = document.createElement('div')
    appContainer.id = 'commentpulse-app'
    shadowRoot.appendChild(appContainer)
    console.log('CommentPulse: App container created')

    // 加载样式到Shadow DOM
    if (cssUrl) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssUrl
      link.onload = () => console.log('CommentPulse: CSS loaded')
      link.onerror = (e) => console.error('CommentPulse: Failed to load CSS', e)
      shadowRoot.appendChild(link)
    }

    // 创建Vue应用
    const app = createApp(App)
    app.use(ElementPlus)
    app.mount(appContainer)
    console.log('CommentPulse: Vue app mounted successfully')
  } catch (error) {
    console.error('CommentPulse: Failed to initialize app', error)
  }
}
