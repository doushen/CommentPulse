# 构建说明

## 前置要求

- Node.js 18+ 
- npm 或 yarn

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

这会监听文件变化并自动重新构建。

## 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 安装到浏览器

### Chrome/Edge

1. 打开浏览器，访问 `chrome://extensions/` 或 `edge://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录下的 `dist` 文件夹

### 测试

1. 访问任意B站视频页面（如：https://www.bilibili.com/video/BV1xx411c7mu）
2. 等待页面加载完成
3. 页面右侧会出现一个蓝色圆形图标
4. 点击图标打开分析面板
5. 插件会自动抓取并分析评论

## 注意事项

- 首次使用SnowNLP需要下载模型文件，可能需要一些时间
- 确保页面已加载评论区域，否则可能无法抓取到评论
- 如果遇到问题，请检查浏览器控制台的错误信息
