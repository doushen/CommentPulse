// Popup页面入口（可选）
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp({
  template: `
    <div style="padding: 20px; width: 300px;">
      <h2>CommentPulse</h2>
      <p>评论分析工具</p>
      <p>请在B站视频页面使用侧边栏图标打开分析面板</p>
    </div>
  `
})

app.use(ElementPlus)
app.mount('#app')
