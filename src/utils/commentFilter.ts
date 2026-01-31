import type { Comment, TopComment } from '@/types'

/**
 * 筛选三条最需关注的评论
 */
export function filterTopComments(comments: Comment[]): TopComment[] {
  const topComments: TopComment[] = []

  // 1. 最高赞提问
  const questionComment = findTopQuestion(comments)
  if (questionComment) {
    topComments.push({
      type: 'question',
      comment: questionComment,
      reason: '这是点赞数最高的提问，可能是观众最关心的问题'
    })
  }

  // 2. 最有建设性意见
  const suggestionComment = findTopSuggestion(comments)
  if (suggestionComment) {
    topComments.push({
      type: 'suggestion',
      comment: suggestionComment,
      reason: '这条评论包含建设性意见，对UP主改进内容有帮助'
    })
  }

  // 3. 最具代表性的情绪宣泄
  const emotionComment = findTopEmotion(comments)
  if (emotionComment) {
    topComments.push({
      type: 'emotion',
      comment: emotionComment,
      reason: '这条评论代表了观众的主要情绪倾向'
    })
  }

  return topComments
}

/**
 * 找到最高赞的提问
 */
function findTopQuestion(comments: Comment[]): Comment | null {
  const questionKeywords = ['？', '?', '什么', '为什么', '怎么', '如何', '能否', '可以吗', '吗？']
  
  const questions = comments.filter(comment => {
    return questionKeywords.some(keyword => comment.content.includes(keyword))
  })

  if (questions.length === 0) {
    // 如果没有明显的提问，选择点赞数最高的评论
    return comments.sort((a, b) => b.likeCount - a.likeCount)[0] || null
  }

  // 按点赞数排序
  questions.sort((a, b) => b.likeCount - a.likeCount)
  return questions[0]
}

/**
 * 找到最有建设性的意见
 */
function findTopSuggestion(comments: Comment[]): Comment | null {
  const suggestionKeywords = ['建议', '可以', '希望', '建议', '推荐', '应该', '最好', '如果', '建议', '改进', '优化']
  
  const suggestions = comments.filter(comment => {
    const hasKeyword = suggestionKeywords.some(keyword => comment.content.includes(keyword))
    // 建设性意见通常有一定长度
    const hasLength = comment.content.length > 10
    return hasKeyword && hasLength
  })

  if (suggestions.length === 0) {
    // 如果没有明显的建议，选择内容较长且点赞数较高的评论
    return comments
      .filter(c => c.content.length > 20)
      .sort((a, b) => {
        // 综合点赞数和内容长度
        const scoreA = a.likeCount + a.content.length / 10
        const scoreB = b.likeCount + b.content.length / 10
        return scoreB - scoreA
      })[0] || null
  }

  // 综合点赞数和内容长度排序
  suggestions.sort((a, b) => {
    const scoreA = a.likeCount + a.content.length / 10
    const scoreB = b.likeCount + b.content.length / 10
    return scoreB - scoreA
  })

  return suggestions[0]
}

/**
 * 找到最具代表性的情绪宣泄
 */
function findTopEmotion(comments: Comment[]): Comment | null {
  // 筛选出有明显情绪倾向的评论
  const emotionalComments = comments.filter(comment => {
    const sentiment = comment.sentiment || 0.5
    // 极端情绪：非常积极或非常消极
    return sentiment > 0.7 || sentiment < 0.3
  })

  if (emotionalComments.length === 0) {
    // 如果没有极端情绪，选择情绪最明显的
    return comments
      .map(c => ({
        ...c,
        emotionScore: Math.abs((c.sentiment || 0.5) - 0.5)
      }))
      .sort((a, b) => b.emotionScore - a.emotionScore)[0] || null
  }

  // 选择点赞数适中的代表性评论（避免选择极端高赞的，选择中等偏上的）
  emotionalComments.sort((a, b) => {
    // 优先选择情绪极端且有一定点赞数的
    const emotionA = Math.abs((a.sentiment || 0.5) - 0.5)
    const emotionB = Math.abs((b.sentiment || 0.5) - 0.5)
    
    if (Math.abs(emotionA - emotionB) > 0.1) {
      return emotionB - emotionA
    }
    
    // 情绪相近时，选择点赞数适中的（不是最高也不是最低）
    const avgLike = emotionalComments.reduce((sum, c) => sum + c.likeCount, 0) / emotionalComments.length
    const scoreA = a.likeCount + (a.likeCount > avgLike ? -Math.abs(a.likeCount - avgLike) : Math.abs(a.likeCount - avgLike))
    const scoreB = b.likeCount + (b.likeCount > avgLike ? -Math.abs(b.likeCount - avgLike) : Math.abs(b.likeCount - avgLike))
    
    return scoreB - scoreA
  })

  return emotionalComments[0] || null
}
