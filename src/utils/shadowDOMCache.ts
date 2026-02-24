// src/utils/shadowDOMCache.ts
// Shadow DOM 查询缓存 - P1 性能优化

/**
 * Shadow DOM 缓存管理器
 * 避免重复遍历 DOM 树
 */
export class ShadowDOMCache {
  private cache = new Map<string, Element[]>()
  private observer: MutationObserver | null = null
  private isObserving = false
  private debounceTimer: number | null = null

  /**
   * 查询元素（带缓存）
   */
  query(selector: string, root: Document | Element = document): Element[] {
    // 检查缓存
    const cacheKey = this.getCacheKey(selector, root)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // 执行查询
    const results = this.queryShadowAll(selector, root)
    
    // 存入缓存
    this.cache.set(cacheKey, results)
    
    // 启动监听
    this.startObserving()
    
    return results
  }

  /**
   * 刷新缓存
   */
  refresh(selector?: string): void {
    if (selector) {
      // 清除特定选择器的缓存
      for (const key of this.cache.keys()) {
        if (key.includes(selector)) {
          this.cache.delete(key)
        }
      }
    } else {
      // 清除所有缓存
      this.cache.clear()
    }
  }

  /**
   * 销毁缓存器
   */
  destroy(): void {
    this.cache.clear()
    this.observer?.disconnect()
    this.observer = null
    this.isObserving = false
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }

  /**
   * 生成缓存 key
   */
  private getCacheKey(selector: string, root: Document | Element): string {
    const rootId = root instanceof Document ? 'document' : (root as Element).tagName
    return `${rootId}:${selector}`
  }

  /**
   * 递归查询 Shadow DOM
   */
  private queryShadowAll(selector: string, root: Document | Element | ShadowRoot): Element[] {
    const results: Element[] = []
    
    // 正常查询
    root.querySelectorAll(selector).forEach(el => results.push(el))
    
    // 递归 Shadow DOM
    const allElements = root.querySelectorAll('*')
    for (const el of allElements) {
      if (el.shadowRoot) {
        results.push(...this.queryShadowAll(selector, el.shadowRoot))
      }
    }
    
    return results
  }

  /**
   * 启动 DOM 变化监听
   */
  private startObserving(): void {
    if (this.isObserving) return
    
    this.isObserving = true
    
    this.observer = new MutationObserver((mutations) => {
      // 防抖处理
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      this.debounceTimer = window.setTimeout(() => {
        // 检查是否有相关变化
        const hasRelevantChange = mutations.some(m => {
          return m.type === 'childList' || 
                 (m.target as Element).tagName?.includes('BILI')
        })
        
        if (hasRelevantChange) {
          this.refresh()
        }
      }, 500) // 500ms 防抖
    })
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    })
  }
}

// 导出单例
export const shadowDOMCache = new ShadowDOMCache()
