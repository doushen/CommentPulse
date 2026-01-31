import type { WordCloudItem } from '@/types'
import type { Comment } from '@/types'

// 中文停用词
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
  '这个', '那个', '什么', '怎么', '为什么', '可以', '应该', '如果', '但是', '因为', '所以', '然后', '还是', '还是', '还是', '还是',
  '视频', 'up主', 'up', '主', 'b站', 'bilibili', '弹幕', '评论', '点赞', '收藏', '分享'
])

/**
 * 提取评论中的关键词
 */
export function extractKeywords(comments: Comment[]): WordCloudItem[] {
  const wordCount: Map<string, number> = new Map()

  comments.forEach(comment => {
    const words = segmentWords(comment.content)
    words.forEach(word => {
      if (word.length > 1 && !STOP_WORDS.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })
  })

  // 转换为数组并排序
  const items: WordCloudItem[] = Array.from(wordCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50) // 取前50个高频词

  return items
}

/**
 * 简单的中文分词（按字符分割，合并连续字符）
 */
function segmentWords(text: string): string[] {
  const words: string[] = []
  const chars = text.split('')
  
  let currentWord = ''
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    
    // 判断是否为中文字符
    if (/[\u4e00-\u9fa5]/.test(char)) {
      currentWord += char
    } else {
      if (currentWord) {
        words.push(currentWord)
        currentWord = ''
      }
      // 处理英文单词
      if (/[a-zA-Z]/.test(char)) {
        currentWord += char
      } else if (currentWord) {
        words.push(currentWord)
        currentWord = ''
      }
    }
  }
  
  if (currentWord) {
    words.push(currentWord)
  }
  
  // 提取2-4字的词组
  const phrases: string[] = []
  for (let i = 0; i < chars.length - 1; i++) {
    const twoChar = chars[i] + chars[i + 1]
    if (/[\u4e00-\u9fa5]{2}/.test(twoChar)) {
      phrases.push(twoChar)
    }
    if (i < chars.length - 2) {
      const threeChar = twoChar + chars[i + 2]
      if (/[\u4e00-\u9fa5]{3}/.test(threeChar)) {
        phrases.push(threeChar)
      }
    }
  }
  
  return [...words, ...phrases]
}
