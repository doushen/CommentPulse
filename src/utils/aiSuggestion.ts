import type { Comment, EmotionStats, TopComment, AISuggestion } from '@/types'

/**
 * 生成AI回应建议（V1.0使用模拟数据）
 */
export async function generateAISuggestion(
  comments: Comment[],
  emotionStats: EmotionStats,
  topComments: TopComment[]
): Promise<AISuggestion> {
  // 模拟AI处理延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 分析整体情绪
  const total = emotionStats.positive + emotionStats.neutral + emotionStats.negative
  const positiveRatio = total > 0 ? emotionStats.positive / total : 0
  const negativeRatio = total > 0 ? emotionStats.negative / total : 0

  // 生成摘要
  let summary = ''
  if (positiveRatio > 0.6) {
    summary = `观众反馈非常积极（${Math.round(positiveRatio * 100)}%），整体评价很高。`
  } else if (negativeRatio > 0.4) {
    summary = `观众反馈中有较多负面情绪（${Math.round(negativeRatio * 100)}%），需要关注和改进。`
  } else {
    summary = `观众反馈整体中性偏积极，有改进空间。`
  }

  // 提取关键点
  const keyPoints: string[] = []

  // 从精选评论中提取关键点
  topComments.forEach(topComment => {
    if (topComment.type === 'question') {
      keyPoints.push(`观众最关心的问题：${topComment.comment.content.substring(0, 30)}...`)
    } else if (topComment.type === 'suggestion') {
      keyPoints.push(`建设性建议：${topComment.comment.content.substring(0, 30)}...`)
    } else if (topComment.type === 'emotion') {
      const emotion = topComment.comment.sentimentLabel === 'positive' ? '积极' : '消极'
      keyPoints.push(`代表性${emotion}情绪：${topComment.comment.content.substring(0, 30)}...`)
    }
  })

  // 添加统计数据
  if (comments.length > 0) {
    const avgLike = comments.reduce((sum, c) => sum + c.likeCount, 0) / comments.length
    keyPoints.push(`平均点赞数：${Math.round(avgLike)}，共${comments.length}条评论`)
  }

  // 生成建议回应
  let suggestedResponse = ''

  if (topComments.length > 0) {
    const question = topComments.find(tc => tc.type === 'question')
    const suggestion = topComments.find(tc => tc.type === 'suggestion')

    suggestedResponse = '感谢大家的评论！'

    if (question) {
      suggestedResponse += `关于"${question.comment.content.substring(0, 20)}..."这个问题，我会在后续视频中详细解答。`
    }

    if (suggestion) {
      suggestedResponse += `感谢"${suggestion.comment.username}"的建议，我会认真考虑并在后续内容中改进。`
    }

    if (positiveRatio > 0.6) {
      suggestedResponse += '看到这么多正面反馈真的很开心，我会继续努力做出更好的内容！'
    } else if (negativeRatio > 0.4) {
      suggestedResponse += '我会认真听取大家的意见，不断改进内容质量。'
    }

    suggestedResponse += '再次感谢大家的支持！'
  } else {
    suggestedResponse = '感谢大家的评论和反馈！我会认真阅读每一条评论，并持续改进内容质量。大家的支持是我前进的动力！'
  }

  return {
    summary,
    keyPoints,
    suggestedResponse
  }
}
