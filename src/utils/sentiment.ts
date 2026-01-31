import type { Comment, EmotionStats } from '@/types'

/**
 * 增强版中文情感分析（基于关键词和模式匹配）
 */
export async function analyzeSentiment(comment: Comment): Promise<Comment> {
  return analyzeSentimentEnhanced(comment)
}

/**
 * 增强版情感分析（关键词匹配 + 模式识别）
 */
function analyzeSentimentEnhanced(comment: Comment): Comment {
  const content = comment.content
  
  // 扩展的积极关键词（包含常见表达）
  const positiveWords = [
    '好', '棒', '赞', '喜欢', '支持', '不错', '厉害', '优秀', '完美', '感谢', '谢谢', 
    '👍', '❤️', '💕', '💖', '💗', '💝', '🎉', '🎊', '太棒了', '太好了', '真不错',
    '给力', '牛逼', '666', 'nice', 'good', 'great', 'awesome', 'amazing', 'wonderful',
    '爱了', '喜欢', '推荐', '收藏', '三连', '投币', '关注', 'up主加油', '继续加油',
    '期待', '希望', '满意', '开心', '高兴', '快乐', '舒服', '爽', '过瘾'
  ]
  
  // 扩展的消极关键词
  const negativeWords = [
    '差', '烂', '垃圾', '讨厌', '失望', '问题', '错误', '不好', '不行', '糟糕', 
    '😡', '💔', '😞', '😠', '😢', '😭', '🤮', '💩',
    '无语', '服了', '醉了', '恶心', '反感', '讨厌', '烦', '无聊', '没意思',
    '差评', '不推荐', '避雷', '踩坑', '浪费时间', '浪费钱', '后悔',
    'bug', '错误', '问题', '失败', '糟糕', '差劲', '垃圾', '废物'
  ]
  
  // 中性/疑问词（会降低情绪强度）
  const neutralWords = ['？', '?', '什么', '为什么', '怎么', '如何', '能否', '可以吗']
  
  let positiveScore = 0
  let negativeScore = 0
  let neutralScore = 0
  
  // 计算积极分数
  positiveWords.forEach(word => {
    const count = (content.match(new RegExp(word, 'gi')) || []).length
    positiveScore += count
  })
  
  // 计算消极分数
  negativeWords.forEach(word => {
    const count = (content.match(new RegExp(word, 'gi')) || []).length
    negativeScore += count
  })
  
  // 计算中性分数
  neutralWords.forEach(word => {
    if (content.includes(word)) neutralScore++
  })
  
  // 表情符号检测
  const emojiPositive = /(👍|❤️|💕|💖|💗|💝|🎉|🎊|😊|😄|😃|😁|😆|😍|🥰|😘)/g
  const emojiNegative = /(😡|💔|😞|😠|😢|😭|🤮|💩|😤|😰|😨|😱)/g
  
  const emojiPositiveCount = (content.match(emojiPositive) || []).length
  const emojiNegativeCount = (content.match(emojiNegative) || []).length
  
  positiveScore += emojiPositiveCount * 2 // 表情符号权重更高
  negativeScore += emojiNegativeCount * 2
  
  // 长度调整：较长的评论可能包含更多信息
  const lengthFactor = Math.min(content.length / 50, 1.5)
  positiveScore *= lengthFactor
  negativeScore *= lengthFactor
  
  // 计算最终情感分数
  const totalScore = positiveScore + negativeScore + neutralScore
  
  if (totalScore === 0) {
    // 没有明显情绪信号，默认为中性
    comment.sentiment = 0.5
    comment.sentimentLabel = 'neutral'
  } else {
    // 归一化到 0-1 范围
    const normalizedPositive = positiveScore / (positiveScore + negativeScore + neutralScore * 0.5)
    comment.sentiment = normalizedPositive
    
    // 分类：积极（>0.6）、中性（0.4-0.6）、消极（<0.4）
    if (comment.sentiment > 0.6) {
      comment.sentimentLabel = 'positive'
    } else if (comment.sentiment < 0.4) {
      comment.sentimentLabel = 'negative'
    } else {
      comment.sentimentLabel = 'neutral'
    }
  }
  
  return comment
}

/**
 * 批量分析评论情感
 */
export async function analyzeCommentsSentiment(comments: Comment[]): Promise<Comment[]> {
  const results = await Promise.all(
    comments.map(comment => analyzeSentiment(comment))
  )
  return results
}

/**
 * 统计情绪比例
 */
export function calculateEmotionStats(comments: Comment[]): EmotionStats {
  const stats: EmotionStats = {
    positive: 0,
    neutral: 0,
    negative: 0
  }

  comments.forEach(comment => {
    const label = comment.sentimentLabel || 'neutral'
    stats[label]++
  })

  return stats
}
