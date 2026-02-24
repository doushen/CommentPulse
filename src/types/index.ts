// src/types/index.ts
// CommentPulse 类型定义

/** 评论数据 */
export interface Comment {
  id: string
  username: string
  content: string
  likeCount: number
  replyCount: number
  time: string
  sentiment?: SentimentType
  sentimentScore?: number
}

/** 情感类型 */
export type SentimentType = 'positive' | 'neutral' | 'negative'

/** 情感统计 */
export interface EmotionStats {
  positive: number
  neutral: number
  negative: number
  total: number
  positivePercent: number
  neutralPercent: number
  negativePercent: number
}

/** 词云数据项 */
export interface WordCloudItem {
  name: string
  value: number
}

/** 精选评论 */
export interface TopComment {
  id: string
  username: string
  content: string
  likeCount: number
  reason: string // 为什么被选中
}

/** AI 建议 */
export interface AISuggestion {
  summary: string
  suggestions: string[]
  keywords: string[]
}

/** 抓取配置 */
export interface ScrapingOptions {
  autoScroll?: boolean
  maxComments?: number
  includeReplies?: boolean
  scrollDelay?: number
}

/** 抓取结果 */
export interface ScrapingResult {
  comments: Comment[]
  total: number
  duration: number
  error?: string
}

/** 分析结果 */
export interface AnalysisResult {
  emotionStats: EmotionStats
  wordCloud: WordCloudItem[]
  topComments: TopComment[]
  aiSuggestion: AISuggestion | null
}

/** 用户痛点 */
export interface PainPoint {
  issue: string
  count: number
  examples: string[]
}

/** 插件配置 */
export interface ExtensionConfig {
  theme: 'light' | 'dark' | 'auto'
  autoAnalyze: boolean
  maxComments: number
  showWordCloud: boolean
  showAISuggestion: boolean
}
