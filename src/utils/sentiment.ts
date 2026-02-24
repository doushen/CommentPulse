// src/utils/sentiment.ts
// 情感分析工具

import type { Comment, EmotionStats, SentimentType } from '@/types'

// 情感词典
const SENTIMENT_DICT = {
  // 正面词
  positive: [
    '好', '棒', '赞', '喜欢', '爱', '优秀', '精彩', '厉害', '强', '666',
    '支持', '期待', '感谢', '有用', '干货', '学到了', '受益匪浅', '清晰',
    '详细', '耐心', '专业', '良心', '宝藏', '神仙', ' yyds', 'nb',
    '不错', '可以', '还行', '给力', '完美', '漂亮', '好看', '好听',
    '感动', '泪目', '笑死', '哈哈哈', '太真实', '有内味', '妙啊',
    '高能', '舒适', '治愈', '上头', '真香', '吹爆', '打卡', '已三连'
  ],
  // 负面词
  negative: [
    '差', '烂', '垃圾', '坑', '骗', '恶心', '讨厌', '失望', '无语', '服了',
    '浪费时间', '没意义', '水', '敷衍', '粗糙', '混乱', '难懂', '听不懂',
    '错误', '误导', '假', '装', '演', '炒作', '恰饭', '广告',
    '难听', '难看', '无聊', '尴尬', '冷', '土', 'low', '拉胯',
    '没用', '废话', '啰嗦', '拖沓', '慢', '卡', '糊', '断',
    '反对', '抵制', '举报', '踩', '踩了', '踩一脚', '不看了', '取关'
  ],
  // 中性词（用于识别中立内容）
  neutral: [
    '请问', '怎么', '什么', '为什么', '如何', '吗', '呢', '吧',
    '了解一下', '咨询', '求助', '问下', '问一下'
  ]
}

/**
 * 分析单条评论的情感
 */
export function analyzeSentiment(comment: Comment): { type: SentimentType; score: number } {
  const content = comment.content.toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  
  // 计算正面词得分
  for (const word of SENTIMENT_DICT.positive) {
    if (content.includes(word.toLowerCase())) {
      positiveScore += 1
      // 带感叹号的加重
      if (content.includes(word + '！') || content.includes(word + '!')) {
        positiveScore += 0.5
      }
    }
  }
  
  // 计算负面词得分
  for (const word of SENTIMENT_DICT.negative) {
    if (content.includes(word.toLowerCase())) {
      negativeScore += 1
      if (content.includes(word + '！') || content.includes(word + '!')) {
        negativeScore += 0.5
      }
    }
  }
  
  // 考虑点赞数作为权重
  const likeWeight = Math.log1p(comment.likeCount) / 5 // 点赞数越高，权重越大
  positiveScore *= (1 + likeWeight)
  negativeScore *= (1 + likeWeight)
  
  // 判断情感类型
  const diff = positiveScore - negativeScore
  const threshold = 0.5
  
  let type: SentimentType
  if (diff > threshold) {
    type = 'positive'
  } else if (diff < -threshold) {
    type = 'negative'
  } else {
    type = 'neutral'
  }
  
  // 计算综合得分 (-1 到 1)
  const score = Math.max(-1, Math.min(1, diff / (positiveScore + negativeScore + 1)))
  
  return { type, score }
}

/**
 * 批量分析评论情感
 */
export async function analyzeCommentsSentiment(comments: Comment[]): Promise<Comment[]> {
  return comments.map(comment => {
    const { type, score } = analyzeSentiment(comment)
    return {
      ...comment,
      sentiment: type,
      sentimentScore: score
    }
  })
}

/**
 * 计算情感统计
 */
export function calculateEmotionStats(comments: Comment[]): EmotionStats {
  const total = comments.length
  if (total === 0) {
    return {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0,
      positivePercent: 0,
      neutralPercent: 0,
      negativePercent: 0
    }
  }
  
  const positive = comments.filter(c => c.sentiment === 'positive').length
  const neutral = comments.filter(c => c.sentiment === 'neutral').length
  const negative = comments.filter(c => c.sentiment === 'negative').length
  
  return {
    positive,
    neutral,
    negative,
    total,
    positivePercent: Math.round((positive / total) * 100),
    neutralPercent: Math.round((neutral / total) * 100),
    negativePercent: Math.round((negative / total) * 100)
  }
}

/**
 * 获取最正面的评论
 */
export function getMostPositiveComments(comments: Comment[], limit: number = 5): Comment[] {
  return comments
    .filter(c => c.sentiment === 'positive')
    .sort((a, b) => (b.sentimentScore || 0) - (a.sentimentScore || 0))
    .slice(0, limit)
}

/**
 * 获取最负面的评论
 */
export function getMostNegativeComments(comments: Comment[], limit: number = 5): Comment[] {
  return comments
    .filter(c => c.sentiment === 'negative')
    .sort((a, b) => (a.sentimentScore || 0) - (b.sentimentScore || 0))
    .slice(0, limit)
}
