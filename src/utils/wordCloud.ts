// src/utils/wordCloud.ts
// 关键词提取和词云生成

import type { Comment, WordCloudItem } from '@/types'

// 停用词
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '啊', '哦', '呢', '吧', '吗', '嗯', '哈哈', '嘿嘿', '呵呵',
  '可以', '就是', '觉得', '感觉', '真的', '其实', '应该', '可能', '一定', '非常',
  '这个', '那个', '什么', '怎么', '为什么', '还是', '但是', '然后', '虽然',
  '因为', '所以', '如果', '只是', '不过', '现在', '已经', '开始', '结束',
  '视频', 'up', 'up主', '作者', '博主', '内容', '评论', '弹幕', '播放'
])

/**
 * 提取关键词
 */
export function extractKeywords(comments: Comment[]): WordCloudItem[] {
  const wordCount = new Map<string, number>()
  
  for (const comment of comments) {
    const words = extractWordsFromText(comment.content)
    
    for (const word of words) {
      if (isValidWord(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1 + Math.log1p(comment.likeCount / 10))
      }
    }
  }
  
  // 转换为数组并排序
  const items: WordCloudItem[] = Array.from(wordCount.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(item => item.value >= 2) // 至少出现2次
    .sort((a, b) => b.value - a.value)
    .slice(0, 50) // 最多50个词
  
  return items
}

/**
 * 从文本中提取词语
 */
function extractWordsFromText(text: string): string[] {
  const words: string[] = []
  
  // 1. 提取2-6字的词组
  for (let len = 2; len <= 6; len++) {
    for (let i = 0; i <= text.length - len; i++) {
      const word = text.substring(i, i + len).trim()
      if (word.length === len) {
        words.push(word)
      }
    }
  }
  
  // 2. 提取英文单词
  const englishWords = text.match(/[a-zA-Z]+/g) || []
  words.push(...englishWords.map(w => w.toLowerCase()))
  
  return words
}

/**
 * 检查是否为有效词
 */
function isValidWord(word: string): boolean {
  // 长度检查
  if (word.length < 2 || word.length > 10) return false
  
  // 停用词检查
  if (STOP_WORDS.has(word)) return false
  
  // 纯数字检查
  if (/^\d+$/.test(word)) return false
  
  // 纯英文检查（允许）
  if (/^[a-zA-Z]+$/.test(word)) return word.length >= 2
  
  // 中文检查 - 至少包含2个中文字符
  const chineseChars = word.match(/[\u4e00-\u9fa5]/g) || []
  if (chineseChars.length < 2) return false
  
  // 过滤特殊字符过多的
  const specialChars = word.match(/[^\u4e00-\u9fa5a-zA-Z0-9]/g) || []
  if (specialChars.length > word.length * 0.3) return false
  
  return true
}

/**
 * 提取热门话题（带 # 标记的）
 */
export function extractTopics(comments: Comment[]): WordCloudItem[] {
  const topicCount = new Map<string, number>()
  
  for (const comment of comments) {
    // 匹配 #话题# 格式
    const topics = comment.content.match(/#([^#]{1,20})#/g) || []
    
    for (const topic of topics) {
      const cleanTopic = topic.replace(/#/g, '')
      if (cleanTopic.length >= 2 && cleanTopic.length <= 15) {
        topicCount.set(cleanTopic, (topicCount.get(cleanTopic) || 0) + 1)
      }
    }
  }
  
  return Array.from(topicCount.entries())
    .map(([name, value]) => ({ name: `#${name}#`, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20)
}

/**
 * 提取艾特用户
 */
export function extractMentions(comments: Comment[]): WordCloudItem[] {
  const mentionCount = new Map<string, number>()
  
  for (const comment of comments) {
    const mentions = comment.content.match(/@[\w\u4e00-\u9fa5]+/g) || []
    
    for (const mention of mentions) {
      const cleanMention = mention.substring(1) // 去掉 @
      if (cleanMention.length >= 2 && cleanMention.length <= 20) {
        mentionCount.set(cleanMention, (mentionCount.get(cleanMention) || 0) + 1)
      }
    }
  }
  
  return Array.from(mentionCount.entries())
    .map(([name, value]) => ({ name: `@${name}`, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)
}

/**
 * 生成词云配置（用于 echarts）
 */
export function generateWordCloudOption(words: WordCloudItem[]) {
  return {
    tooltip: {
      show: true,
      formatter: (params: any) => `${params.name}: ${params.value}次`
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '90%',
      right: null,
      bottom: null,
      sizeRange: [12, 50],
      rotationRange: [-45, 45],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      layoutAnimation: true,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: function () {
          const colors = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171']
          return colors[Math.floor(Math.random() * colors.length)]
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          shadowBlur: 10,
          shadowColor: '#333'
        }
      },
      data: words
    }]
  }
}
