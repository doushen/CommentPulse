import type { Comment } from '@/types'

/**
 * 从B站视频页面抓取评论数据
 * 适配新版B站页面结构
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
      // 查找评论容器
      const commentWrap = document.querySelector('.reply-wrap') || 
                          document.querySelector('[class*="reply-wrap"]') ||
                          document.querySelector('[class*="comment-wrap"]') ||
                          document.querySelector('.bili-comment')
      
      if (commentWrap) {
        console.log('CommentPulse: 找到评论区域', commentWrap.className)
        return
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    console.warn('CommentPulse: 等待评论区域超时')
  }

  private scrapeCurrentComments(): void {
    // 直接使用已知的 B站评论区结构
    const selectors = [
      '.reply-wrap .reply-item',
      '[class*="reply-wrap"] [class*="reply-item"]',
      '.bili-comment .comment-item',
      '[class*="comment-wrap"] [class*="comment-item"]'
    ]

    let totalComments = 0
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector)
      
      if (elements.length > 0) {
        console.log(`CommentPulse: 选择器 "${selector}" 找到 ${elements.length} 个评论`)
        
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
        
        // 找到一个有效的选择器就退出
        if (totalComments > 0) break
      }
    }

    if (totalComments === 0) {
      // 降级方案：尝试更宽松的查找
      console.log('CommentPulse: 尝试降级方案...')
      this.fallbackScrape()
    } else {
      console.log(`CommentPulse: 成功抓取 ${totalComments} 条评论，总计 ${this.comments.length} 条`)
    }
  }

  private fallbackScrape(): void {
    // 降级方案：查找用户信息+评论内容的组合
    const userContents = document.querySelectorAll('.user-content, [class*="user-content"]')
    
    userContents.forEach((el, idx) => {
      const parent = el.closest('.reply-item, [class*="reply-item"], li, div[class*="reply"]')
      if (parent) {
        const comment = this.extractCommentData(parent, idx)
        if (comment && comment.content && comment.content.length > 2) {
          if (!this.comments.find(c => c.id === comment.id)) {
            this.comments.push(comment)
          }
        }
      }
    })
    
    console.log(`CommentPulse: 降级方案抓取 ${this.comments.length} 条评论`)
  }

  private extractCommentData(element: Element, index: number): Comment | null {
    try {
      // 用户名 - 从 user-name 或 user-info 中找
      const userNameEl = element.querySelector('.user-name, [class*="user-name"], .username, [class*="username"]')
      const username = userNameEl?.textContent?.trim() || 
                       userNameEl?.getAttribute('text')?.trim() || 
                       `用户${index}`

      // 评论内容 - 从 reply-content 中找
      const contentEl = element.querySelector('.reply-content, [class*="reply-content"], .comment-content, [class*="comment-content"]')
      let content = contentEl?.textContent?.trim() || ''
      
      // 如果没找到，尝试获取元素的直接文本
      if (!content) {
        const allText = element.textContent || ''
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        // 过滤掉非内容
        content = lines.find(l => 
          l.length > 3 && 
          !l.match(/^\d+$/) && 
          !l.includes('赞') &&
          !l.includes('回复') &&
          !l.includes('IP属地')
        ) || ''
      }

      if (!content || content.length < 3) {
        return null
      }

      // 点赞数 - 从 reply-info 中找数字
      const replyInfoEl = element.querySelector('.reply-info, [class*="reply-info"]')
      const likeText = replyInfoEl?.textContent?.trim() || '0'
      const likeCount = this.parseCount(likeText)

      // 回复数
      const replyCountEl = element.querySelector('.reply-count, [class*="reply-count"]')
      const replyCountText = replyCountEl?.textContent?.trim() || '0'
      const replyCount = this.parseCount(replyCountText)

      // 时间
      const timeEl = element.querySelector('.reply-time, [class*="reply-time"], .time, [class*="time"]')
      const time = timeEl?.textContent?.trim() || ''

      // 生成唯一ID
      const id = `${username}-${content.substring(0, 20)}-${index}-${Date.now()}`

      return {
        id,
        username: username.substring(0, 30),
        content: content.substring(0, 500),
        likeCount,
        replyCount,
        time
      }
    } catch (error) {
      console.error('CommentPulse: 提取评论数据失败', error)
      return null
    }
  }

  private parseCount(text: string): number {
    if (!text) return 0
    
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
