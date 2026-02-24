// src/content/index.ts
// Content Script 统一入口

import { commentScraper } from '@/utils/commentScraper'
import { analyzeCommentsSentiment, calculateEmotionStats } from '@/utils/sentiment'
import { extractKeywords, extractTopics } from '@/utils/wordCloud'
import { filterTopComments } from '@/utils/commentFilter'
import { generateAISuggestion } from '@/utils/aiSuggestion'
import type { AnalysisResult, Comment } from '@/types'

console.log('[CommentPulse] Content script loaded')

// ========== 配置常量 ==========
const CONFIG = {
  INIT_DELAY: 2000,
  EXTRACT_DELAY: 3000,
  CHECK_INTERVAL: 1000,
  MAX_RETRY: 5
} as const

// ========== 页面检测 ==========
function isBilibiliVideoPage(): boolean {
  return window.location.hostname.includes('bilibili.com') && 
         window.location.pathname.startsWith('/video/')
}

// ========== UI 注入 ==========
function injectUI(): void {
  if (document.getElementById('commentpulse-root')) {
    return
  }

  const root = document.createElement('div')
  root.id = 'commentpulse-root'
  document.body.appendChild(root)

  // 注入样式
  const style = document.createElement('style')
  style.textContent = `
    #commentpulse-sidebar {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #commentpulse-toggle {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50% 0 0 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 24px;
      box-shadow: -4px 0 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }
    #commentpulse-toggle:hover {
      transform: scale(1.1);
    }
    #commentpulse-panel {
      position: absolute;
      right: 55px;
      top: 50%;
      transform: translateY(-50%);
      width: 380px;
      max-height: 70vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      overflow: hidden;
      display: none;
    }
    #commentpulse-panel.active {
      display: block;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translate(10px, -50%); }
      to { opacity: 1; transform: translate(0, -50%); }
    }
    .cp-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cp-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .cp-header button {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .cp-header button:hover {
      background: rgba(255,255,255,0.2);
    }
    .cp-content {
      padding: 20px;
      max-height: calc(70vh - 60px);
      overflow-y: auto;
    }
    .cp-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .cp-stat {
      text-align: center;
      padding: 12px;
      background: #f8f9ff;
      border-radius: 8px;
    }
    .cp-stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }
    .cp-stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .cp-button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .cp-button:hover {
      opacity: 0.9;
    }
    .cp-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .cp-loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .cp-result {
      margin-top: 20px;
    }
    .cp-section {
      margin-bottom: 20px;
    }
    .cp-section h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #333;
    }
  `
  document.head.appendChild(style)

  // 渲染 UI
  root.innerHTML = `
    <div id="commentpulse-sidebar">
      <div id="commentpulse-toggle">🐝</div>
      <div id="commentpulse-panel">
        <div class="cp-header">
          <h3>🐝 评论分析</h3>
          <button id="cp-close">×</button>
        </div>
        <div class="cp-content" id="cp-content">
          <button class="cp-button" id="cp-start">开始分析</button>
        </div>
      </div>
    </div>
  `

  // 绑定事件
  document.getElementById('commentpulse-toggle')?.addEventListener('click', togglePanel)
  document.getElementById('cp-close')?.addEventListener('click', closePanel)
  document.getElementById('cp-start')?.addEventListener('click', startAnalysis)

  console.log('[CommentPulse] UI injected')
}

function togglePanel(): void {
  const panel = document.getElementById('commentpulse-panel')
  panel?.classList.toggle('active')
}

function closePanel(): void {
  const panel = document.getElementById('commentpulse-panel')
  panel?.classList.remove('active')
}

// ========== 分析逻辑 ==========
async function startAnalysis(): Promise<void> {
  const content = document.getElementById('cp-content')
  if (!content) return

  content.innerHTML = `
    <div class="cp-loading">
      <div>🔄 正在分析评论...</div>
      <div style="margin-top: 10px; font-size: 12px; color: #999;">请稍候</div>
    </div>
  `

  try {
    // 1. 抓取评论
    const result = await commentScraper.startScraping({
      autoScroll: true,
      maxComments: 500,
      scrollDelay: 600
    })

    if (result.comments.length === 0) {
      content.innerHTML = `
        <div class="cp-loading">
          <div>😕 未找到评论</div>
          <div style="margin-top: 10px; font-size: 12px; color: #999;">
            请确保视频已加载评论区域
          </div>
        </div>
        <button class="cp-button" id="cp-retry" style="margin-top: 20px;">重试</button>
      `
      document.getElementById('cp-retry')?.addEventListener('click', startAnalysis)
      return
    }

    // 2. 分析情感
    const analyzedComments = await analyzeCommentsSentiment(result.comments)
    const emotionStats = calculateEmotionStats(analyzedComments)

    // 3. 提取关键词
    const wordCloud = extractKeywords(analyzedComments)
    const topics = extractTopics(analyzedComments)

    // 4. 筛选精选评论
    const topComments = filterTopComments(analyzedComments, { limit: 5 })

    // 5. 生成 AI 建议
    const aiSuggestion = await generateAISuggestion(analyzedComments, emotionStats, topComments)

    // 6. 显示结果
    showResults({
      emotionStats,
      wordCloud,
      topComments,
      aiSuggestion
    }, result.comments.length)

  } catch (error) {
    console.error('[CommentPulse] Analysis failed:', error)
    content.innerHTML = `
      <div class="cp-loading">
        <div>❌ 分析失败</div>
        <div style="margin-top: 10px; font-size: 12px; color: #999;">
          ${error instanceof Error ? error.message : '未知错误'}
        </div>
      </div>
      <button class="cp-button" id="cp-retry" style="margin-top: 20px;">重试</button>
    `
    document.getElementById('cp-retry')?.addEventListener('click', startAnalysis)
  }
}

function showResults(result: AnalysisResult, totalCount: number): void {
  const content = document.getElementById('cp-content')
  if (!content) return

  const { emotionStats, wordCloud, topComments, aiSuggestion } = result

  content.innerHTML = `
    <div class="cp-stats">
      <div class="cp-stat">
        <div class="cp-stat-value">${totalCount}</div>
        <div class="cp-stat-label">评论数</div>
      </div>
      <div class="cp-stat">
        <div class="cp-stat-value" style="color: #22c55e;">${emotionStats.positivePercent}%</div>
        <div class="cp-stat-label">好评</div>
      </div>
      <div class="cp-stat">
        <div class="cp-stat-value" style="color: #ef4444;">${emotionStats.negativePercent}%</div>
        <div class="cp-stat-label">差评</div>
      </div>
    </div>
    
    <div class="cp-result">
      ${aiSuggestion ? `
        <div class="cp-section">
          <h4>💡 总结</h4>
          <div style="font-size: 13px; color: #666; line-height: 1.6;">
            ${aiSuggestion.summary}
          </div>
        </div>
        
        ${aiSuggestion.suggestions.length > 0 ? `
          <div class="cp-section">
            <h4>📝 建议</h4>
            <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #666; line-height: 1.8;">
              ${aiSuggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      ` : ''}
      
      ${topComments.length > 0 ? `
        <div class="cp-section">
          <h4>⭐ 精选评论</h4>
          <div style="font-size: 12px; color: #666;">
            ${topComments.map(c => `
              <div style="padding: 10px; background: #f8f9ff; border-radius: 6px; margin-bottom: 8px;">
                <div style="font-weight: 600; color: #667eea;">${c.username}</div>
                <div style="margin: 4px 0; line-height: 1.5;">${c.content.substring(0, 100)}${c.content.length > 100 ? '...' : ''}</div>
                <div style="font-size: 11px; color: #999;">👍 ${c.likeCount} · ${c.reason}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    
    <button class="cp-button" id="cp-again" style="margin-top: 20px;">重新分析</button>
  `
  
  document.getElementById('cp-again')?.addEventListener('click', startAnalysis)
}

// ========== 消息监听 ==========
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_COMMENTS') {
    commentScraper.startScraping().then(result => {
      sendResponse({ success: true, ...result })
    }).catch(error => {
      sendResponse({ success: false, error: error.message })
    })
    return true // 异步响应
  }
  
  if (message.type === 'GET_COMMENTS') {
    chrome.storage.local.get(['commentpulse_comments'], (result) => {
      const comments = result.commentpulse_comments || []
      sendResponse({ comments, count: comments.length })
    })
    return true
  }
  
  if (message.type === 'TOGGLE_PANEL') {
    togglePanel()
    sendResponse({ success: true })
  }
})

// ========== 初始化 ==========
function init(): void {
  if (!isBilibiliVideoPage()) {
    console.log('[CommentPulse] Not a Bilibili video page, skipping')
    return
  }

  console.log('[CommentPulse] Initializing...')
  
  setTimeout(() => {
    injectUI()
  }, CONFIG.INIT_DELAY)
}

// 监听页面变化（SPA 路由）
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    // 清理旧 UI
    document.getElementById('commentpulse-root')?.remove()
    if (isBilibiliVideoPage()) {
      console.log('[CommentPulse] Page changed, reinitializing...')
      setTimeout(init, CONFIG.INIT_DELAY)
    }
  }
}).observe(document, { subtree: true, childList: true })

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
