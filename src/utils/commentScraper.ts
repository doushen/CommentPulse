import type { Comment } from '@/types'

/**
 * 从B站视频页面抓取评论数据
 */
export class CommentScraper {
  private comments: Comment[] = []
  private observer: MutationObserver | null = null

  /**
   * 开始抓取评论
   */
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

  /**
   * 等待评论区域出现
   */
  private async waitForComments(maxWait = 10000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWait) {
      // B站评论区域的多种可能选择器
      const commentList = document.querySelector('.bb-comment') || 
                         document.querySelector('.comment-list') ||
                         document.querySelector('[class*="comment-list"]') ||
                         document.querySelector('.reply-item') ||
                         document.querySelector('[class*="reply-item"]') ||
                         document.querySelector('.comment-item') ||
                         document.querySelector('[class*="comment-item"]') ||
                         document.querySelector('[class*="comment"]')
      
      if (commentList) {
        console.log('CommentPulse: 找到评论区域', commentList.className)
        return
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    console.warn('CommentPulse: 等待评论区域超时')
  }

  /**
   * 抓取当前页面的评论
   */
  private scrapeCurrentComments(): void {
    // B站评论的多种可能选择器（按优先级排序）
    const selectors = [
      '.reply-item',
      '[class*="reply-item"]',
      '.bb-comment .reply-item',
      '.comment-item',
      '[class*="comment-item"]',
      '.comment-list .item',
      '[class*="comment-list"] [class*="item"]',
      // 更通用的选择器
      'li[class*="comment"]',
      'div[class*="comment"]',
      // 尝试通过文本内容查找
      '[class*="user-name"]',
      '[class*="username"]'
    ]

    let commentElements: NodeListOf<Element> | null = null
    let usedSelector = ''

    for (const selector of selectors) {
      commentElements = document.querySelectorAll(selector)
      if (commentElements.length > 0) {
        usedSelector = selector
        console.log(`CommentPulse: 使用选择器 "${selector}" 找到 ${commentElements.length} 个元素`)
        break
      }
    }

    if (!commentElements || commentElements.length === 0) {
      // 只在第一次或每10次打印一次警告，避免刷屏
      if (this.comments.length === 0 || Math.random() < 0.1) {
        console.warn('CommentPulse: 未找到评论元素，尝试查找评论区域...')
        // 尝试查找评论区域
        const commentArea = document.querySelector('[class*="comment"]')
        if (commentArea) {
          console.log('CommentPulse: 找到评论区域，但未找到具体评论项', commentArea.className)
        }
      }
      return
    }

    let addedCount = 0
    commentElements.forEach((element, index) => {
      const comment = this.extractCommentData(element, index)
      if (comment && comment.content && comment.content.length > 0) {
        // 避免重复
        if (!this.comments.find(c => c.id === comment.id)) {
          this.comments.push(comment)
          addedCount++
        }
      }
    })
    
    if (addedCount > 0) {
      console.log(`CommentPulse: 成功抓取 ${addedCount} 条新评论，总计 ${this.comments.length} 条`)
    }
  }

  /**
   * 从DOM元素提取评论数据
   */
  private extractCommentData(element: Element, index: number): Comment | null {
    try {
      // 用户名 - 多种可能的选择器
      const usernameSelectors = [
        '.user-name',
        '[class*="user-name"]',
        '.username',
        '[class*="username"]',
        '.name',
        '[class*="name"]',
        'a[href*="space"]',
        '[class*="user"]'
      ]
      
      let usernameEl: Element | null = null
      for (const selector of usernameSelectors) {
        usernameEl = element.querySelector(selector)
        if (usernameEl) break
      }
      
      const username = usernameEl?.textContent?.trim() || 
                      usernameEl?.getAttribute('title')?.trim() ||
                      `用户${index}`

      // 评论内容 - 多种可能的选择器
      const contentSelectors = [
        '.text',
        '[class*="text"]',
        '.reply-content',
        '[class*="reply-content"]',
        '.content',
        '[class*="content"]',
        '.comment-text',
        '[class*="comment-text"]',
        'p',
        'span[class*="text"]'
      ]
      
      let contentEl: Element | null = null
      for (const selector of contentSelectors) {
        contentEl = element.querySelector(selector)
        if (contentEl && contentEl.textContent?.trim()) break
      }
      
      // 如果没找到，尝试直接获取文本内容（排除用户名和按钮）
      let content = contentEl?.textContent?.trim() || ''
      if (!content) {
        // 获取所有文本，排除已知的非内容元素
        const allText = element.textContent || ''
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        // 过滤掉用户名、时间、数字等
        content = lines.find(line => 
          line.length > 5 && 
          !/^\d+$/.test(line) && 
          !/^\d{4}-\d{2}-\d{2}/.test(line) &&
          !line.includes('回复') &&
          !line.includes('点赞')
        ) || ''
      }

      if (!content || content.length < 2) {
        return null
      }

      // 点赞数 - 多种可能的选择器
      const likeSelectors = [
        '.like',
        '[class*="like"]',
        '[title*="赞"]',
        '[class*="up"]',
        '[class*="zan"]'
      ]
      
      let likeEl: Element | null = null
      for (const selector of likeSelectors) {
        likeEl = element.querySelector(selector)
        if (likeEl) break
      }
      
      const likeText = likeEl?.textContent?.trim() || 
                      likeEl?.getAttribute('title')?.trim() || 
                      '0'
      const likeCount = this.parseCount(likeText)

      // 回复数
      const replySelectors = [
        '.reply',
        '[class*="reply"]',
        '[class*="comment-count"]'
      ]
      
      let replyEl: Element | null = null
      for (const selector of replySelectors) {
        replyEl = element.querySelector(selector)
        if (replyEl) break
      }
      
      const replyText = replyEl?.textContent?.trim() || '0'
      const replyCount = this.parseCount(replyText)

      // 时间
      const timeSelectors = [
        '.time',
        '[class*="time"]',
        '[class*="date"]'
      ]
      
      let timeEl: Element | null = null
      for (const selector of timeSelectors) {
        timeEl = element.querySelector(selector)
        if (timeEl) break
      }
      
      const time = timeEl?.textContent?.trim() || ''

      // 生成唯一ID
      const id = `${username}-${content.substring(0, 30)}-${index}-${Date.now()}`

      return {
        id,
        username,
        content,
        likeCount,
        replyCount,
        time
      }
    } catch (error) {
      console.error('CommentPulse: 提取评论数据失败', error)
      return null
    }
  }

  /**
   * 解析数量文本（如 "1.2万" -> 12000）
   */
  private parseCount(text: string): number {
    if (!text) return 0
    
    const num = parseFloat(text.replace(/[^\d.]/g, ''))
    if (isNaN(num)) return 0
    
    if (text.includes('万')) {
      return Math.floor(num * 10000)
    }
    if (text.includes('k') || text.includes('K')) {
      return Math.floor(num * 1000)
    }
    
    return Math.floor(num)
  }

  /**
   * 监听新评论加载
   */
  private observeNewComments(): void {
    // 查找评论容器
    const targetSelectors = [
      '.bb-comment',
      '.comment-list',
      '[class*="comment-list"]',
      '[class*="comment"]',
      'main',
      '#app',
      document.body
    ]
    
    let targetNode: Element | null = null
    for (const selector of targetSelectors) {
      if (typeof selector === 'string') {
        targetNode = document.querySelector(selector)
      } else {
        targetNode = selector
      }
      if (targetNode) break
    }

    if (!targetNode) {
      console.warn('CommentPulse: 未找到评论容器，使用 body 作为监听目标')
      targetNode = document.body
    }

    // 使用防抖，避免频繁触发
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

  /**
   * 滚动加载更多评论
   */
  private async loadMoreComments(): Promise<void> {
    let lastCommentCount = this.comments.length
    let noChangeCount = 0

    const scrollInterval = setInterval(() => {
      // 滚动到底部
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      })

      // 检查是否有新评论
      this.scrapeCurrentComments()
      
      if (this.comments.length === lastCommentCount) {
        noChangeCount++
        // 如果连续3次没有新评论，停止滚动
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
    }, 1000)

    // 10秒后停止自动滚动
    setTimeout(() => {
      clearInterval(scrollInterval)
    }, 10000)
  }

  /**
   * 停止抓取
   */
  stopScraping(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  /**
   * 获取已抓取的评论
   */
  getComments(): Comment[] {
    return this.comments
  }
}
