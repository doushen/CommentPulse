// src/utils/storage.ts
// 存储管理工具 - P1 性能优化

import type { Comment, ExtensionConfig } from '@/types'

const STORAGE_KEYS = {
  COMMENTS: 'commentpulse_comments',
  COMMENTS_META: 'commentpulse_comments_meta',
  CONFIG: 'commentpulse_config',
  STATS: 'commentpulse_stats',
  LAST_UPDATE: 'commentpulse_lastUpdate'
} as const

const CHUNK_SIZE = 500 // 每分片500条评论

/**
 * 分片存储评论（解决大数据量问题）
 */
export async function saveCommentsChunked(comments: Comment[]): Promise<void> {
  const chunks = Math.ceil(comments.length / CHUNK_SIZE)
  
  // 保存元数据
  await chrome.storage.local.set({
    [STORAGE_KEYS.COMMENTS_META]: {
      total: comments.length,
      chunks,
      lastUpdate: Date.now()
    }
  })
  
  // 分片保存
  const promises: Promise<void>[] = []
  for (let i = 0; i < chunks; i++) {
    const chunk = comments.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    promises.push(
      chrome.storage.local.set({
        [`${STORAGE_KEYS.COMMENTS}_${i}`]: chunk
      })
    )
  }
  
  await Promise.all(promises)
}

/**
 * 分片读取评论
 */
export async function loadCommentsChunked(): Promise<Comment[]> {
  const meta = await chrome.storage.local.get(STORAGE_KEYS.COMMENTS_META)
  const metaData = meta[STORAGE_KEYS.COMMENTS_META]
  
  if (!metaData || metaData.chunks === 0) {
    return []
  }
  
  const comments: Comment[] = []
  const keys = Array.from({ length: metaData.chunks }, (_, i) =>
    `${STORAGE_KEYS.COMMENTS}_${i}`
  )
  
  const chunks = await chrome.storage.local.get(keys)
  
  for (let i = 0; i < metaData.chunks; i++) {
    const chunk = chunks[`${STORAGE_KEYS.COMMENTS}_${i}`]
    if (chunk) {
      comments.push(...chunk)
    }
  }
  
  return comments
}

/**
 * 清空评论存储
 */
export async function clearComments(): Promise<void> {
  const meta = await chrome.storage.local.get(STORAGE_KEYS.COMMENTS_META)
  const metaData = meta[STORAGE_KEYS.COMMENTS_META]
  
  const keysToRemove: string[] = [STORAGE_KEYS.COMMENTS_META, STORAGE_KEYS.LAST_UPDATE]
  
  if (metaData?.chunks) {
    for (let i = 0; i < metaData.chunks; i++) {
      keysToRemove.push(`${STORAGE_KEYS.COMMENTS}_${i}`)
    }
  }
  
  await chrome.storage.local.remove(keysToRemove)
}

/**
 * 保存配置
 */
export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.CONFIG]: config
  })
}

/**
 * 加载配置
 */
export async function loadConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONFIG)
  return result[STORAGE_KEYS.CONFIG] || {
    theme: 'auto',
    autoAnalyze: true,
    maxComments: 1000,
    showWordCloud: true,
    showAISuggestion: true
  }
}

/**
 * 增量更新（只保存新增的评论）
 */
export async function appendComments(newComments: Comment[]): Promise<void> {
  const existing = await loadCommentsChunked()
  const existingIds = new Set(existing.map(c => c.id))
  
  // 过滤掉已存在的
  const uniqueNew = newComments.filter(c => !existingIds.has(c.id))
  
  if (uniqueNew.length > 0) {
    const combined = [...existing, ...uniqueNew]
    await saveCommentsChunked(combined)
  }
  
  return
}

/**
 * 压缩存储（对于大量数据）
 */
export async function saveCompressed(key: string, data: any): Promise<void> {
  const json = JSON.stringify(data)
  // 简单压缩：使用 LZ-string 或自定义压缩
  // 这里使用 base64 作为示例
  const compressed = btoa(json)
  await chrome.storage.local.set({ [key]: compressed })
}

export async function loadCompressed(key: string): Promise<any> {
  const result = await chrome.storage.local.get(key)
  if (!result[key]) return null
  
  try {
    const json = atob(result[key])
    return JSON.parse(json)
  } catch {
    return null
  }
}
