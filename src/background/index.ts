// src/background/index.ts
// Background Service Worker - 统一入口

import type { Comment } from '@/types'

console.log('[CommentPulse] Background service worker started')

// ========== 安装/更新处理 ==========
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[CommentPulse] Extension installed/updated:', details.reason)
  
  // 初始化存储
  chrome.storage.local.set({
    'commentpulse_version': chrome.runtime.getManifest().version,
    'commentpulse_installed_at': Date.now()
  })
  
  // 显示安装通知
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🐝 CommentPulse 已安装',
      message: '访问 B站视频页面即可开始使用评论分析功能'
    })
  }
})

// ========== 消息处理中心 ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message
  
  switch (type) {
    case 'GET_COMMENTS':
      handleGetComments(sendResponse)
      return true
      
    case 'SAVE_COMMENTS':
      handleSaveComments(payload, sendResponse)
      return true
      
    case 'CLEAR_COMMENTS':
      handleClearComments(sendResponse)
      return true
      
    case 'GET_STATS':
      handleGetStats(sendResponse)
      return true
      
    case 'EXPORT_DATA':
      handleExportData(payload, sendResponse)
      return true
      
    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage()
      sendResponse({ success: true })
      return false
      
    default:
      console.warn('[CommentPulse] Unknown message type:', type)
      sendResponse({ success: false, error: 'Unknown message type' })
      return false
  }
})

// ========== 处理函数 ==========

async function handleGetComments(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get([
      'commentpulse_comments',
      'commentpulse_lastUpdate'
    ])
    
    sendResponse({
      success: true,
      comments: result.commentpulse_comments || [],
      lastUpdate: result.commentpulse_lastUpdate || 0
    })
  } catch (error) {
    console.error('[CommentPulse] Failed to get comments:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get comments'
    })
  }
}

async function handleSaveComments(
  payload: { comments: Comment[] },
  sendResponse: (response: any) => void
) {
  try {
    await chrome.storage.local.set({
      'commentpulse_comments': payload.comments,
      'commentpulse_lastUpdate': Date.now()
    })
    
    sendResponse({ success: true, count: payload.comments.length })
  } catch (error) {
    console.error('[CommentPulse] Failed to save comments:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save comments'
    })
  }
}

async function handleClearComments(sendResponse: (response: any) => void) {
  try {
    await chrome.storage.local.remove([
      'commentpulse_comments',
      'commentpulse_lastUpdate'
    ])
    
    sendResponse({ success: true })
  } catch (error) {
    console.error('[CommentPulse] Failed to clear comments:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear comments'
    })
  }
}

async function handleGetStats(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get([
      'commentpulse_comments',
      'commentpulse_stats'
    ])
    
    const comments: Comment[] = result.commentpulse_comments || []
    
    // 计算统计
    const stats = {
      totalComments: comments.length,
      totalLikes: comments.reduce((sum, c) => sum + c.likeCount, 0),
      avgLikes: comments.length > 0 
        ? Math.round(comments.reduce((sum, c) => sum + c.likeCount, 0) / comments.length)
        : 0,
      positiveCount: comments.filter(c => c.sentiment === 'positive').length,
      negativeCount: comments.filter(c => c.sentiment === 'negative').length,
      neutralCount: comments.filter(c => c.sentiment === 'neutral').length
    }
    
    sendResponse({ success: true, stats })
  } catch (error) {
    console.error('[CommentPulse] Failed to get stats:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    })
  }
}

async function handleExportData(
  payload: { format: 'json' | 'csv' },
  sendResponse: (response: any) => void
) {
  try {
    const result = await chrome.storage.local.get(['commentpulse_comments'])
    const comments: Comment[] = result.commentpulse_comments || []
    
    let content: string
    let filename: string
    let mimeType: string
    
    if (payload.format === 'csv') {
      // CSV 格式
      const headers = ['ID', 'Username', 'Content', 'Likes', 'Replies', 'Time', 'Sentiment', 'Score']
      const rows = comments.map(c => [
        c.id,
        `"${c.username.replace(/"/g, '""')}"`,
        `"${c.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        c.likeCount,
        c.replyCount,
        c.time,
        c.sentiment || 'unknown',
        c.sentimentScore || 0
      ])
      
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      filename = `commentpulse_export_${Date.now()}.csv`
      mimeType = 'text/csv;charset=utf-8;'
    } else {
      // JSON 格式
      content = JSON.stringify({
        exportedAt: Date.now(),
        total: comments.length,
        comments
      }, null, 2)
      filename = `commentpulse_export_${Date.now()}.json`
      mimeType = 'application/json'
    }
    
    // 创建下载
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    await chrome.downloads.download({
      url,
      filename,
      saveAs: true
    })
    
    URL.revokeObjectURL(url)
    sendResponse({ success: true, filename })
    
  } catch (error) {
    console.error('[CommentPulse] Failed to export data:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export data'
    })
  }
}

// ========== Tab 状态管理 ==========
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成且是 B站视频页时，可以发送消息通知 content script
  if (changeInfo.status === 'complete' && tab.url?.includes('bilibili.com/video/')) {
    console.log('[CommentPulse] Bilibili video page loaded:', tabId)
  }
})

// ========== 错误处理 ==========
self.addEventListener('error', (event) => {
  console.error('[CommentPulse] Background error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[CommentPulse] Unhandled promise rejection:', event.reason)
})
