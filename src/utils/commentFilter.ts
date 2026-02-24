// src/utils/commentFilter.ts
// 评论筛选工具

import type { Comment, TopComment } from '@/types'

/**
 * 筛选精选评论
 */
export function filterTopComments(
  comments: Comment[],
  options: {
    limit?: number
    minLikeCount?: number
    includeReplies?: boolean
    deduplicate?: boolean
  } = {}
): TopComment[] {
  const {
    limit = 10,
    minLikeCount = 5,
    includeReplies = false,
    deduplicate = true
  } = options

  let filtered = [...comments]

  // 1. 过滤低质量评论
  filtered = filtered.filter(c => {
    // 长度检查
    if (c.content.length < 5) return false
    
    // 点赞数检查
    if (c.likeCount < minLikeCount) return false
    
    // 过滤纯表情
    if (isOnlyEmojis(c.content)) return false
    
    // 过滤重复内容
    if (deduplicate && isDuplicateContent(c.content, filtered)) return false
    
    return true
  })

  // 2. 计算综合得分
  const scored = filtered.map(comment => ({
    comment,
    score: calculateCommentScore(comment)
  }))

  // 3. 排序并取前N
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // 4. 转换为 TopComment 格式
  return top.map(({ comment, score }) => ({
    id: comment.id,
    username: comment.username,
    content: comment.content,
    likeCount: comment.likeCount,
    reason: generateSelectionReason(comment, score)
  }))
}

/**
 * 筛选最有价值的回复
 */
export function filterValuableReplies(
  comments: Comment[],
  minLikeCount: number = 3
): Comment[] {
  return comments
    .filter(c => c.replyCount > 0 || c.likeCount >= minLikeCount)
    .sort((a, b) => b.likeCount - a.likeCount)
}

/**
 * 按时间筛选（获取最新评论）
 */
export function filterRecentComments(
  comments: Comment[],
  hours: number = 24
): Comment[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  
  return comments.filter(c => {
    const commentTime = parseCommentTime(c.time)
    return commentTime > cutoff
  })
}

/**
 * 按情感筛选
 */
export function filterBySentiment(
  comments: Comment[],
  sentiment: 'positive' | 'neutral' | 'negative'
): Comment[] {
  return comments.filter(c => c.sentiment === sentiment)
}

/**
 * 搜索评论
 */
export function searchComments(
  comments: Comment[],
  keyword: string
): Comment[] {
  const lowerKeyword = keyword.toLowerCase()
  return comments.filter(c =>
    c.content.toLowerCase().includes(lowerKeyword) ||
    c.username.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 计算评论得分
 */
function calculateCommentScore(comment: Comment): number {
  let score = 0
  
  // 点赞权重（对数）
  score += Math.log1p(comment.likeCount) * 10
  
  // 内容长度权重（适中为佳）
  const lengthScore = Math.min(comment.content.length, 200) / 10
  score += lengthScore
  
  // 情感权重（正面加分，负面减分）
  if (comment.sentiment === 'positive') {
    score += 5
  } else if (comment.sentiment === 'negative') {
    score -= 3
  }
  
  // 回复数权重
  score += Math.log1p(comment.replyCount) * 3
  
  // 关键词加分
  const valuableKeywords = ['干货', '学到了', '有用', '谢谢', '感谢', '详细', '清晰']
  for (const keyword of valuableKeywords) {
    if (comment.content.includes(keyword)) {
      score += 3
      break // 只加一次
    }
  }
  
  return score
}

/**
 * 生成选中原因
 */
function generateSelectionReason(comment: Comment, score: number): string {
  const reasons: string[] = []
  
  if (comment.likeCount >= 100) {
    reasons.push('高赞')
  }
  
  if (comment.content.length > 100) {
    reasons.push('长文')
  }
  
  if (comment.sentiment === 'positive') {
    reasons.push('好评')
  }
  
  if (comment.replyCount > 5) {
    reasons.push('热评')
  }
  
  if (reasons.length === 0) {
    reasons.push('优质')
  }
  
  return reasons.join(' · ')
}

/**
 * 检查是否纯表情
 */
function isOnlyEmojis(text: string): boolean {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const emojis = text.match(emojiRegex) || []
  return emojis.length > 0 && (text.length - emojis.join('').length) < 5
}

/**
 * 检查是否重复内容
 */
function isDuplicateContent(content: string, allComments: Comment[]): boolean {
  const similarCount = allComments.filter(c => {
    const similarity = calculateSimilarity(content, c.content)
    return similarity > 0.8 // 80% 相似度
  }).length
  
  return similarCount > 3 // 超过3条相似视为重复
}

/**
 * 计算文本相似度（简单的 Jaccard 系数）
 */
function calculateSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(''))
  const setB = new Set(b.split(''))
  
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  
  return intersection.size / union.size
}

/**
 * 解析评论时间
 */
function parseCommentTime(timeStr: string): number {
  // 处理 "2024-01-15" 格式
  if (/^\d{4}-\d{2}-\d{2}/.test(timeStr)) {
    return new Date(timeStr).getTime()
  }
  
  // 处理 "X小时前" 格式
  const hourMatch = timeStr.match(/(\d+)小时前/)
  if (hourMatch) {
    return Date.now() - parseInt(hourMatch[1]) * 60 * 60 * 1000
  }
  
  // 处理 "X天前" 格式
  const dayMatch = timeStr.match(/(\d+)天前/)
  if (dayMatch) {
    return Date.now() - parseInt(dayMatch[1]) * 24 * 60 * 60 * 1000
  }
  
  return Date.now()
}
