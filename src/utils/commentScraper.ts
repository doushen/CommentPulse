// src/utils/commentScraper.ts
// 评论抓取器 - 统一抓取逻辑

import type { Comment, ScrapingOptions, ScrapingResult } from '@/types'

export class CommentScraper {
  private comments: Comment[] = []
  private isRunning = false
  private abortController: AbortController | null = null

  /**
   * 开始抓取评论
   */
  async startScraping(options: ScrapingOptions = {}): Promise<ScrapingResult> {
    const startTime = Date.now()
    
    if (this.isRunning) {
      return { comments: [], total: 0, duration: 0, error: '抓取已在进行中' }
    }

    this.isRunning = true
    this.abortController = new AbortController()
    this.comments = []

    try {
      const {
        autoScroll = true,
        maxComments = 1000,
        includeReplies = false,
        scrollDelay = 800
      } = options

      // 1. 自动滚动加载更多评论
      if (autoScroll) {
        await this.autoScroll(maxComments, scrollDelay)
      }

      // 2. 提取评论
      this.comments = this.extractComments(includeReplies)

      // 3. 保存到 storage
      await this.saveToStorage()

      return {
        comments: this.comments,
        total: this.comments.length,
        duration: Date.now() - startTime
      }

    } catch (error) {
      console.error('[CommentScraper] 抓取失败:', error)
      return {
        comments: this.comments,
        total: this.comments.length,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    } finally {
      this.isRunning = false
      this.abortController = null
    }
  }

  /**
   * 停止抓取
   */
  stopScraping(): void {
    this.abortController?.abort()
    this.isRunning = false
  }

  /**
   * 获取已抓取的评论
   */
  getComments(): Comment[] {
    return [...this.comments]
  }

  /**
   * 清空评论
   */
  clearComments(): void {
    this.comments = []
  }

  /**
   * 自动滚动页面加载评论
   */
  private async autoScroll(maxComments: number, delay: number): Promise<void> {
    const scrollContainer = this.findScrollContainer()
    if (!scrollContainer) {
      console.warn('[CommentScraper] 未找到滚动容器')
      return
    }

    let lastCommentCount = 0
    let noChangeCount = 0
    const maxNoChange = 3 // 连续3次无变化则停止

    while (this.isRunning && !this.abortController?.signal.aborted) {
      // 滚动到底部
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })

      await this.delay(delay)

      // 检查是否有新评论
      const currentCount = this.countCommentsInDOM()
      if (currentCount >= maxComments) break

      if (currentCount === lastCommentCount) {
        noChangeCount++
        if (noChangeCount >= maxNoChange) break
      } else {
        noChangeCount = 0
        lastCommentCount = currentCount
      }
    }
  }

  /**
   * 提取评论
   */
  private extractComments(includeReplies: boolean): Comment[] {
    const comments: Comment[] = []
    const seen = new Set<string>() // 去重

    // 查找所有评论渲染器
    const threads = this.queryShadowAll('bili-comment-thread-renderer')

    for (const thread of threads) {
      if (!thread.shadowRoot) continue

      // 提取主评论
      const mainComment = this.extractCommentFromRenderer(thread.shadowRoot)
      if (mainComment && !seen.has(mainComment.id)) {
        comments.push(mainComment)
        seen.add(mainComment.id)
      }

      // 提取回复（可选）
      if (includeReplies) {
        const replies = thread.shadowRoot.querySelectorAll('bili-comment-renderer')
        for (const reply of replies) {
          if (!reply.shadowRoot) continue
          const replyComment = this.extractCommentFromRenderer(reply.shadowRoot)
          if (replyComment && !seen.has(replyComment.id)) {
            comments.push(replyComment)
            seen.add(replyComment.id)
          }
        }
      }
    }

    return comments
  }

  /**
   * 从单个渲染器提取评论
   */
  private extractCommentFromRenderer(shadowRoot: ShadowRoot): Comment | null {
    try {
      // 获取用户名
      let username = '匿名'
      const userInfo = shadowRoot.querySelector('bili-comment-user-info')
      if (userInfo?.shadowRoot) {
        const nameEl = userInfo.shadowRoot.querySelector('#user-name a')
        username = nameEl?.textContent?.trim() || '匿名'
      }

      // 获取评论内容
      let content = ''
      const contentDiv = shadowRoot.querySelector('#content')
      if (contentDiv) {
        content = contentDiv.textContent?.trim() || ''
      }

      // 如果没找到，尝试其他方式
      if (!content) {
        const richText = shadowRoot.querySelector('bili-rich-text')
        if (richText) {
          content = richText.textContent?.trim() || ''
        }
      }

      // 过滤无效内容
      if (!content || content.length < 2 || content.includes('置顶')) {
        return null
      }

      // 获取点赞数
      let likeCount = 0
      const actionBtns = shadowRoot.querySelector('bili-comment-action-buttons-renderer')
      if (actionBtns?.shadowRoot) {
        const likeEl = actionBtns.shadowRoot.querySelector('#like')
        if (likeEl) {
          const likeText = likeEl.textContent?.trim() || '0'
          likeCount = this.parseLikeCount(likeText)
        }
      }

      // 获取时间
      let time = ''
      const timeEl = shadowRoot.querySelector('#pubdate')
      if (timeEl) {
        time = timeEl.textContent?.trim() || ''
      }

      return {
        id: this.generateCommentId(username, content),
        username: username.substring(0, 20),
        content: content.substring(0, 500),
        likeCount,
        replyCount: 0,
        time
      }

    } catch (error) {
      console.error('[CommentScraper] 提取单条评论失败:', error)
      return null
    }
  }

  /**
   * 递归查询 Shadow DOM
   */
  private queryShadowAll(selector: string, root: Document | Element | ShadowRoot = document): Element[] {
    const results: Element[] = []
    
    // 正常查询
    root.querySelectorAll(selector).forEach(el => results.push(el))
    
    // 递归 Shadow DOM
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        results.push(...this.queryShadowAll(selector, el.shadowRoot))
      }
    })
    
    return results
  }

  /**
   * 查找滚动容器
   */
  private findScrollContainer(): HTMLElement | null {
    // B站评论区的滚动容器
    const selectors = [
      '.reply-list',
      '.bili-comments__list',
      '[class*="comment"] [class*="list"]'
    ]
    
    for (const selector of selectors) {
      const el = document.querySelector(selector) as HTMLElement
      if (el) return el
    }
    
    // 默认使用 body
    return document.body
  }

  /**
   * 统计 DOM 中评论数量
   */
  private countCommentsInDOM(): number {
    return this.queryShadowAll('bili-comment-thread-renderer').length
  }

  /**
   * 解析点赞数
   */
  private parseLikeCount(text: string): number {
    if (!text) return 0
    
    // 处理 "1.2万" 格式
    if (text.includes('万')) {
      return Math.round(parseFloat(text) * 10000)
    }
    
    return parseInt(text.replace(/[^\d]/g, '')) || 0
  }

  /**
   * 生成评论 ID
   */
  private generateCommentId(username: string, content: string): string {
    const hash = `${username}-${content.substring(0, 30)}`
      .split('')
      .reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)
      .toString(36)
    
    return `cp-${Date.now()}-${hash.substring(0, 8)}`
  }

  /**
   * 保存到 storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await chrome.storage.local.set({
        'commentpulse_comments': this.comments,
        'commentpulse_lastUpdate': Date.now()
      })
    } catch (error) {
      console.error('[CommentScraper] 保存失败:', error)
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例
export const commentScraper = new CommentScraper()
