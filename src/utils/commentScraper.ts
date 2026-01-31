import type { Comment } from '@/types'

/**
 * 从B站视频页面抓取评论数据
 * 适配最新版B站页面结构
 */
export class CommentScraper {
  private comments: Comment[] = []
  private observer: MutationObserver | null = null

  async startScraping(): Promise<Comment[]> {
    this.comments = []
    
    // 等待评论区域加载
    await this.waitForComments()
    
    // 抓取当前已加载的评论
    this.scrapeCurrentComments()
    
    // 监听新评论加载
    this.observeNewComments()
    
    // 滚动加载更多评论
    this.loadMoreComments()
    
    return this.comments
  }

  private async waitForComments(maxWait = 10000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWait) {
      // 尝试多种方式查找评论区域
      const selectors = [
        // 新版B站
        '.bili-comment',
        '.comment-list',
        '.reply-list',
        // 通用
        '[class*="comment"]',
        '[id*="comment"]',
        // 降级方案
        'section',
        'main'
      ]
      
      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el && el.textContent && el.textContent.length > 100) {
          console.log('CommentPulse: 找到评论区域', selector, el.className)
          return
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    console.warn('CommentPulse: 等待评论区域超时')
  }

  private scrapeCurrentComments(): void {
    // 尝试所有可能的评论选择器
    const selectors = [
      // 新版B站
      '.reply-item',
      '.comment-item', 
      '.bili-comment-item',
      // 旧版B站
      '.bb-comment .reply-item',
      '.comment-list .item',
      // 通用选择器
      '[class*="reply-item"]',
      '[class*="comment-item"]',
      '[class*="comment-"]',
      // 按内容特征查找
      '.user-name',
      '[class*="username"]',
      // 更宽松的查找
      'li[class*="rply"]',
      'div[class*="reply"]',
      // 最后手段：查找所有可能的评论容器内的文本元素
      '.text-content',
      '.reply-content',
      '[class*="content"]'
    ]

    let foundAny = false
    let totalComments = 0
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        console.log(`CommentPulse: 选择器 "${selector}" 找到 ${elements.length} 个元素`)
        foundAny = true
        
        elements.forEach((el, idx) => {
          const comment = this.extractCommentData(el, idx)
          if (comment && comment.content && comment.content.length > 2) {
            // 避免重复
            if (!this.comments.find(c => c.id === comment.id)) {
              this.comments.push(comment)
              totalComments++
            }
          }
        })
      }
    }

    if (!foundAny) {
      // 降级方案：直接查找包含用户名的所有元素
      console.log('CommentPulse: 尝试降级方案，查找所有用户名元素')
      const userElements = document.querySelectorAll('[class*="user"], [class*="name"]')
      console.log(`CommentPulse: 找到 ${userElements.length} 个用户名相关元素`)
      
      if (userElements.length > 0) {
        let idx = 0
        userElements.forEach(el => {
          const parent = el.closest('div, li, tr, article')
          if (parent) {
            const comment = this.extractCommentData(parent, idx++)
            if (comment && comment.content && comment.content.length > 2) {
              if (!this.comments.find(c => c.id === comment.id)) {
                this.comments.push(comment)
              }
            }
          }
        })
      }
    }
    
    if (totalComments > 0) {
      console.log(`CommentPulse: 成功抓取 ${totalComments} 条评论，总计 ${this.comments.length} 条`)
    }
  }

  private extractCommentData(element: Element, index: number): Comment | null {
    try {
      // 获取文本内容（排除按钮等非内容元素）
      const allText = element.textContent || ''
      
      // 过滤掉常见非内容文本
      const lines = allText.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .filter(l => !l.match(/^\d+$/)) // 纯数字
        .filter(l => !l.match(/^\d{4}-\d{2}-\d{2}/)) // 日期
        .filter(l => !l.includes('回复')) // 回复链接
        .filter(l => !l.includes('点赞')) // 点赞链接
        .filter(l => !l.includes('收藏')) // 收藏链接
        .filter(l => !l.includes('分享')) // 分享链接
        .filter(l => !l.includes('IP属地')) // IP属地
      
      // 评论内容通常是较长的那行
      const content = lines.find(l => l.length > 5) || lines[lines.length - 1] || ''
      
      if (!content || content.length < 3) {
        return null
      }

      // 用户名（通常是较短的那行）
      const username = lines.find(l => l.length > 1 && l.length < 20 && !l.includes('：')) || `用户${index}`

      // 点赞数（包含数字的元素）
      const likeText = lines.find(l => l.match(/\d+/) && (l.includes('赞') || l.includes('up') || l.match(/^\d+$/))) || '0'
      const likeCount = this.parseCount(likeText)

      // 时间
      const timeText = lines.find(l => l.match(/\d{2}:\d{2}/) || l.match(/\d+分钟前/) || l.match(/\d+小时前/) || l.match(/\d+天前/)) || ''
      const time = timeText

      // 生成唯一ID
      const id = `${username}-${content.substring(0, 20)}-${index}-${Date.now()}`

      return {
        id,
        username: username.substring(0, 20),
        content: content.substring(0, 500),
        likeCount,
        replyCount: 0,
        time
      }
    } catch (error) {
      console.error('CommentPulse: 提取评论数据失败', error)
      return null
    }
  }

  private parseCount(text: string): number {
    if (!text) return 0
    
    // 提取数字
    const num = parseFloat(text.replace(/[^\d.]/g, ''))
    if (isNaN(num)) return 0
    
    if (text.includes('万')) return Math.floor(num * 10000)
    if (text.includes('k') || text.includes('K')) return Math.floor(num * 1000)
    
    return Math.floor(num)
  }

  private observeNewComments(): void {
    const targetNode = document.body

    let debounceTimer: NodeJS.Timeout | null = null
    this.observer = new MutationObserver(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(() => {
        this.scrapeCurrentComments()
      }, 500)
    })

    this.observer.observe(targetNode, {
      childList: true,
      subtree: true
    })
  }

  private async loadMoreComments(): Promise<void> {
    let lastCommentCount = this.comments.length
    let noChangeCount = 0

    const scrollInterval = setInterval(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      })

      this.scrapeCurrentComments()
      
      if (this.comments.length === lastCommentCount) {
        noChangeCount++
        if (noChangeCount >= 3) {
          clearInterval(scrollInterval)
          if (this.observer) {
            this.observer.disconnect()
          }
        }
      } else {
        noChangeCount = 0
        lastCommentCount = this.comments.length
      }
    }, 1500)

    setTimeout(() => {
      clearInterval(scrollInterval)
    }, 15000)
  }

  stopScraping(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  getComments(): Comment[] {
    return this.comments
  }
}
