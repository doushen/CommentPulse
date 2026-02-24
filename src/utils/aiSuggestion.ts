// src/utils/aiSuggestion.ts
// AI 建议生成器（本地实现，不依赖外部 API）

import type { Comment, EmotionStats, TopComment, AISuggestion } from '@/types'

/**
 * 生成 AI 建议
 */
export async function generateAISuggestion(
  comments: Comment[],
  emotionStats: EmotionStats,
  topComments: TopComment[]
): Promise<AISuggestion> {
  // 1. 分析常见问题
  const commonIssues = analyzeCommonIssues(comments)
  
  // 2. 提取内容主题
  const themes = extractThemes(comments)
  
  // 3. 生成建议
  const suggestions = generateSuggestions(comments, emotionStats, commonIssues)
  
  // 4. 生成总结
  const summary = generateSummary(emotionStats, themes, comments.length)
  
  return {
    summary,
    suggestions,
    keywords: themes.slice(0, 10)
  }
}

/**
 * 分析常见问题
 */
function analyzeCommonIssues(comments: Comment[]): string[] {
  const issuePatterns = [
    { pattern: /画.{0,3}[质质].{0,3}[差差糊糊低]/, name: '画质问题' },
    { pattern: /[声声][音音].{0,3}[小低轻]/, name: '声音问题' },
    { pattern: /[太很].{0,3}[快短]/, name: '节奏问题' },
    { pattern: /[没不].{0,3}[懂明白]/, name: '理解问题' },
    { pattern: /[广告推广]/, name: '广告问题' },
    { pattern: /[水敷衍]/, name: '内容质量问题' }
  ]
  
  const issues: string[] = []
  
  for (const { pattern, name } of issuePatterns) {
    const count = comments.filter(c => pattern.test(c.content)).length
    if (count >= 3) {
      issues.push(`${name}(${count}次提及)`)
    }
  }
  
  return issues
}

/**
 * 提取内容主题
 */
function extractThemes(comments: Comment[]): string[] {
  const themeKeywords: Record<string, string[]> = {
    '教程': ['教', '学', '怎么', '如何', '步骤', '方法'],
    '科普': ['知识', '原理', '科学', '技术', '介绍'],
    '娱乐': ['搞笑', '有趣', '好玩', '笑', '乐'],
    '测评': ['测试', '对比', '评测', '体验', '感受'],
    'vlog': ['日常', '生活', '记录', '分享'],
    '游戏': ['游戏', '玩家', '通关', '攻略', '操作']
  }
  
  const themeCounts: Record<string, number> = {}
  
  for (const comment of comments) {
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      for (const keyword of keywords) {
        if (comment.content.includes(keyword)) {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1
          break
        }
      }
    }
  }
  
  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme)
}

/**
 * 生成建议
 */
function generateSuggestions(
  comments: Comment[],
  emotionStats: EmotionStats,
  issues: string[]
): string[] {
  const suggestions: string[] = []
  
  // 基于情感分布的建议
  if (emotionStats.negativePercent > 20) {
    suggestions.push('负面评价较多，建议关注用户反馈并改进内容质量')
  } else if (emotionStats.positivePercent > 70) {
    suggestions.push('好评如潮！可以保持当前的内容风格')
  }
  
  // 基于常见问题的建议
  for (const issue of issues) {
    if (issue.includes('画质')) {
      suggestions.push('多位观众反馈画质问题，建议提高视频分辨率或码率')
    }
    if (issue.includes('声音')) {
      suggestions.push('声音较小，建议调整音频增益或提醒观众调高音量')
    }
    if (issue.includes('节奏')) {
      suggestions.push('视频节奏较快，可以适当放慢语速或增加过渡')
    }
    if (issue.includes('理解')) {
      suggestions.push('部分内容较难理解，可以增加解释说明或分步骤演示')
    }
  }
  
  // 基于评论热度的建议
  const avgLikes = comments.reduce((sum, c) => sum + c.likeCount, 0) / comments.length
  if (avgLikes < 5) {
    suggestions.push('评论互动较少，可以尝试在视频中增加互动环节或提问')
  }
  
  // 基于评论长度的建议
  const longComments = comments.filter(c => c.content.length > 50).length
  if (longComments / comments.length < 0.1) {
    suggestions.push('长评论较少，可以尝试抛出更有深度的话题引导讨论')
  }
  
  // 通用建议
  if (suggestions.length < 3) {
    suggestions.push('定期回复评论可以增加观众粘性')
    suggestions.push('关注高频关键词，可以据此规划后续内容')
  }
  
  return suggestions.slice(0, 5) // 最多5条建议
}

/**
 * 生成总结
 */
function generateSummary(
  emotionStats: EmotionStats,
  themes: string[],
  totalComments: number
): string {
  const parts: string[] = []
  
  // 整体评价
  if (emotionStats.positivePercent >= 60) {
    parts.push('整体评价非常正面')
  } else if (emotionStats.positivePercent >= 40) {
    parts.push('整体评价偏向正面')
  } else if (emotionStats.negativePercent >= 40) {
    parts.push('整体评价较为负面')
  } else {
    parts.push('整体评价中性')
  }
  
  // 数据概览
  parts.push(`共分析 ${totalComments} 条评论`)
  
  // 主题
  if (themes.length > 0) {
    parts.push(`主要涉及：${themes.slice(0, 3).join('、')}`)
  }
  
  return parts.join('，')
}

/**
 * 生成回复建议（针对单条评论）
 */
export function generateReplySuggestion(comment: Comment): string {
  const templates: Record<string, string[]> = {
    positive: [
      '谢谢支持！会继续努力的 💪',
      '感谢认可！你的鼓励是我最大的动力 🙏',
      '开心能帮到你！有问题随时问 😊'
    ],
    question: [
      '好问题！我整理一下在下次视频中详细解答',
      '这个确实值得深入讲，记下了 📌',
      '简单说就是...（建议详细回复）'
    ],
    suggestion: [
      '很好的建议！我会认真考虑的',
      '感谢反馈，正在改进中 🛠️',
      '收到！下期内容会调整'
    ],
    neutral: [
      '感谢观看！',
      '有什么想看的可以告诉我~',
      '欢迎常来 😊'
    ]
  }
  
  // 判断评论类型
  let type: keyof typeof templates = 'neutral'
  
  if (comment.sentiment === 'positive') {
    type = 'positive'
  } else if (/[?？]/.test(comment.content)) {
    type = 'question'
  } else if (/[建议希望]|能不能|可不可以/.test(comment.content)) {
    type = 'suggestion'
  }
  
  const typeTemplates = templates[type]
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)]
}
