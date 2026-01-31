# 插件问题排查指南

## 问题：看不到插件

### 1. 检查插件是否已加载

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions/` 或 `edge://extensions/`
3. 确保右上角"开发者模式"已开启
4. 检查列表中是否有 "CommentPulse - 评论脉搏"
5. 如果看到插件但有错误（红色提示），点击"错误"查看详情

### 2. 检查插件是否正确加载

如果插件列表中没有，请：
1. 点击"加载已解压的扩展程序"
2. 选择项目根目录下的 `dist` 文件夹（不是 `src` 文件夹）
3. 如果提示错误，检查 `dist` 目录是否包含：
   - manifest.json
   - js/ 目录（包含 content.js, inject.js, background.js 等）
   - css/ 目录（包含 style.css）
   - icons/ 目录（包含图标文件）

### 3. 检查图标文件

如果图标文件是占位符（只有 "placeholder" 文本），可能导致插件无法正常显示：

**临时解决方案：**
1. 打开 `dist/manifest.json`
2. 暂时注释掉或删除 `icons` 和 `action.default_icon` 部分
3. 重新加载插件

**永久解决方案：**
创建真实的 PNG 图标文件（16x16, 48x48, 128x128），放到 `public/icons/` 目录，然后重新构建。

### 4. 检查 Content Script 是否执行

1. 访问任意 B 站视频页面（如：https://www.bilibili.com/video/BV1xx411c7mu）
2. 按 F12 打开开发者工具
3. 切换到"控制台"标签
4. 查看是否有以下日志：
   - `CommentPulse: Content script loaded`
   - `CommentPulse: Is video page? true`
   - `CommentPulse: Attempting to inject app`
   - `CommentPulse: inject.js loaded, initializing Vue app`
   - `CommentPulse: Vue app mounted successfully`

如果没有看到这些日志，说明：
- Content script 没有执行（检查 manifest.json 的 matches 配置）
- 或者页面 URL 不匹配（确保是 `/video/` 开头的路径）

### 5. 检查页面元素

1. 在 B 站视频页面，按 F12 打开开发者工具
2. 切换到"元素"标签
3. 搜索 `commentpulse-shadow-host`
4. 如果找到，说明插件已注入
5. 检查页面右侧是否有一个蓝色圆形图标

### 6. 常见错误

**错误：无法加载清单文件**
- 检查 `dist/manifest.json` 是否存在且格式正确
- 确保 JSON 格式正确（没有语法错误）

**错误：无法加载资源**
- 检查 `web_accessible_resources` 配置
- 确保 `js/inject.js` 和 `css/style.css` 文件存在

**错误：Content script 未执行**
- 检查 manifest.json 中的 `matches` 配置
- 确保 URL 匹配（必须是 `https://www.bilibili.com/video/*`）

### 7. 重新构建

如果修改了代码，需要重新构建：

```bash
npm run build
```

然后：
1. 在扩展程序页面，点击插件的"刷新"按钮
2. 或者先移除插件，再重新加载

### 8. 检查浏览器兼容性

- Chrome 88+ 或 Edge 88+（支持 Manifest V3）
- 确保浏览器版本足够新

## 如果仍然无法解决

1. 查看浏览器控制台的完整错误信息
2. 检查 `dist` 目录的文件结构
3. 确认所有依赖都已安装（`npm install`）
4. 尝试在无痕模式下测试（排除其他扩展干扰）
