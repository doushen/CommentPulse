# Contributing to CommentPulse

感谢您对 CommentPulse 项目的兴趣！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交 Pull Request
- 💰 赞助支持

---

## 如何贡献

### 1. 报告 Bug

请通过 [GitHub Issues](https://github.com/doushen/CommentPulse/issues) 报告Bug，并包含以下信息：

- Bug 描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器版本、操作系统等）
- 截图/日志（如有）

### 2. 提出建议

请通过 [GitHub Discussions](https://github.com/doushen/CommentPulse/discussions) 提出建议，包括：

- 功能描述
- 使用场景
- 预期效果
- 参考案例（如有）

### 3. 提交代码

#### 准备工作

```bash
# 1. Fork 项目
# 2. 克隆到本地
git clone https://github.com/YOUR_USERNAME/CommentPulse.git
cd CommentPulse

# 3. 安装依赖
npm install

# 4. 创建分支
git checkout -b feature/your-feature-name
```

#### 开发流程

```bash
# 1. 开发模式（热更新）
npm run dev

# 2. 构建测试
npm run build

# 3. 测试插件
# - 打开 chrome://extensions/
# - 加载 dist 目录
# - 测试功能

# 4. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 5. 推送并创建 PR
git push origin feature/your-feature-name
```

#### 代码规范

- 使用 **TypeScript** 编写
- 遵循 **Vue 3** Composition API 风格
- 组件使用 **PascalCase**（如 `AnalysisPanel.vue`）
- 工具函数使用 **camelCase**（如 `sentiment.ts`）
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

### 4. 文档改进

文档改进同样欢迎！包括：
- 错别字纠正
- 语法改进
- 添加示例
- 补充说明

---

## 开发规范

### Git Flow

- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支
- `release/*`: 发布分支

### 代码风格

```typescript
// ✅ 好的写法
interface Comment {
  id: number;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// ❌ 不好的写法
interface Comment {
  id: number;
  content: string;
  sentiment: string;  // 应该使用联合类型
}
```

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档改进
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

#### 示例

```
feat(emotion): 添加情绪分析可视化

- 使用 ECharts 饼图展示情绪分布
- 支持点击查看详情
- 添加动画效果

Closes #123
```

---

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:unit
```

---

## 发布流程

1. 更新版本号（semver）
2. 更新 CHANGELOG.md
3. 创建 Release
4. 构建并上传到 Chrome 商店

---

## 社区

- 💬 [GitHub Discussions](https://github.com/doushen/CommentPulse/discussions)
- 🐦 [Twitter](https://twitter.com/commentpulse)
- 📧 邮箱：commentpulse@example.com

---

再次感谢您的贡献！ 🎉
