// src/utils/performance.ts
// 性能监控工具 - P1 优化

/**
 * 性能标记
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(`commentpulse_${name}`)
  }
}

/**
 * 性能测量
 */
export function measure(name: string, startMark: string, endMark?: string): void {
  if (typeof performance !== 'undefined') {
    try {
      performance.measure(
        `commentpulse_${name}`,
        `commentpulse_${startMark}`,
        endMark ? `commentpulse_${endMark}` : undefined
      )
    } catch (e) {
      // 忽略测量错误
    }
  }
}

/**
 * 获取性能数据
 */
export function getPerformanceData(): PerformanceEntry[] {
  if (typeof performance === 'undefined') return []
  
  return performance.getEntriesByType('measure')
    .filter(entry => entry.name.startsWith('commentpulse_'))
}

/**
 * 性能装饰器
 */
export function measurePerformance(
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value
  
  descriptor.value = async function (...args: any[]) {
    const start = performance.now()
    const result = await originalMethod.apply(this, args)
    const end = performance.now()
    
    console.log(`[Performance] ${propertyKey}: ${(end - start).toFixed(2)}ms`)
    return result
  }
  
  return descriptor
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 内存使用监控
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize
    }
  }
  return null
}
