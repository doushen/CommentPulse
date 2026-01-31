// 评论数据类型
export interface Comment {
  id: string
  username: string
  content: string
  likeCount: number
  replyCount: number
  time: string
  sentiment?: number // 情感分数 0-1
  sentimentLabel?: 'positive' | 'neutral' | 'negative'
}

// 情绪统计
export interface EmotionStats {
  positive: number
  neutral: number
  negative: number
}

// 词云数据
export interface WordCloudItem {
  name: string
  value: number
}

// 精选评论类型
export interface TopComment {
  type: 'question' | 'suggestion' | 'emotion'
  comment: Comment
  reason: string
}

// AI建议
export interface AISuggestion {
  summary: string
  keyPoints: string[]
  suggestedResponse: string
}
