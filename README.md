# 🐝 CommentPulse - 评论脉搏

<div align="center">

**B站视频评论分析浏览器插件，自动收集并分析视频评论**

</div>

---

## ✨ 功能特性

| 功能 | 描述 | 状态 |
|------|------|------|
| 🔄 **自动收集评论** | 自动滚动页面，拦截 API 请求收集所有评论 | ✅ 已完成 |
| 📊 **评论统计分析** | 统计评论总数、平均点赞数 | ✅ 已完成 |
| 😊 **情绪分析** | 区分好评/差评，统计数量 | ✅ 已完成 |
| 🔥 **关键词提取** | 提取热门关键词并展示 | ✅ 已完成 |
| ⚠️ **痛点识别** | 检测用户反馈的问题和抱怨 | ✅ 已完成 |
| ❓ **问题统计** | 识别用户咨询类评论 | ✅ 已完成 |
| 🎨 **美观的 UI** | 蓝色渐变风格，现代化界面 | ✅ 已完成 |

---

## 🚀 快速开始

### 安装方法

```bash
# 1. 克隆项目
git clone https://github.com/doushen/CommentPulse.git
cd CommentPulse

# 2. 加载到浏览器
# - 打开 chrome://extensions/
# - 开启"开发者模式"
# - 点击"加载已解压的扩展程序"
# - 选择 dist 目录
```

---

## 📖 使用方法

1. 打开任意 **B站视频页面**
2. 点击页面右侧的 **🐝 图标**
3. 点击面板中的 **"开始收集"** 按钮
4. 等待自动滚动收集评论
5. 查看分析结果：
   - 总评论数、平均点赞
   - 好评/差评数量
   - 热门关键词
   - 用户痛点

---

## 📁 项目结构

```
CommentPulse/
├── src/
│   └── content/
│       └── inject-page.ts   # 主逻辑（UI + 评论收集 + 分析）
├── dist/                    # 构建输出
├── public/
│   └── icons/              # 图标文件
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon128.png
│       └── logo.svg
├── manifest.json           # Chrome 扩展配置
└── README.md
```

---

## 🛠️ 技术实现

- **评论收集**：拦截页面 API 请求 + 自动滚动
- **数据分析**：关键词提取、情绪分类
- **UI**：原生 JavaScript + CSS（轻量级）
- **存储**：localStorage 缓存数据

---

## ⚠️ 注意事项

- 需要在 B站视频页面使用
- 评论收集需要一些时间（自动滚动）
- 收集完成后可查看分析结果

---

## 📄 License

MIT License

---

## 📞 联系方式

- **GitHub**: https://github.com/doushen/CommentPulse
- **问题反馈**: GitHub Issues

---

<div align="center">

**如果对你有帮助，请点个 ⭐ Star 支持！**

</div>
