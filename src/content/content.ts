// Content script - 检测B站视频页面并注入脚本
console.log('CommentPulse: Content script loaded')

// 检查是否为B站视频页面
function isBilibiliVideoPage(): boolean {
  const isVideo = window.location.hostname.includes('bilibili.com') &&
         window.location.pathname.startsWith('/video/')
  console.log('CommentPulse: Is video page?', isVideo, window.location.href)
  return isVideo
}

// 注入Vue应用
function injectApp() {
  console.log('CommentPulse: Attempting to inject app')
  // 检查是否已经注入（通过检查shadow host）
  if (document.getElementById('commentpulse-shadow-host')) {
    console.log('CommentPulse: Already injected, skipping')
    return // 已经注入过了
  }

  // 获取资源URL（在content script上下文中）
  const injectJsUrl = chrome.runtime.getURL('js/inject.js')
  const indexJsUrl = chrome.runtime.getURL('js/index.js')
  const cssUrl = chrome.runtime.getURL('css/style.css')
  
  // 通过 data 属性传递配置（避免内联脚本）
  const configElement = document.createElement('div')
  configElement.id = 'commentpulse-config'
  configElement.style.display = 'none'
  configElement.setAttribute('data-inject-url', injectJsUrl)
  configElement.setAttribute('data-index-url', indexJsUrl)
  configElement.setAttribute('data-css-url', cssUrl)
  configElement.setAttribute('data-runtime-id', chrome.runtime.id)
  document.body.appendChild(configElement)
  
  // 创建script标签加载inject.js（不使用内联脚本）
  const script = document.createElement('script')
  script.src = injectJsUrl
  script.type = 'module'
  script.onload = () => console.log('CommentPulse: inject.js loaded')
  script.onerror = (e) => console.error('CommentPulse: Failed to load inject.js', e)
  document.head.appendChild(script)
  console.log('CommentPulse: inject.js script tag added')
}

// 等待页面加载完成后注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isBilibiliVideoPage()) {
      setTimeout(injectApp, 1000) // 延迟1秒确保页面完全加载
    }
  })
} else {
  if (isBilibiliVideoPage()) {
    setTimeout(injectApp, 1000)
  }
}

// 监听页面变化（B站使用SPA，URL变化时重新注入）
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    if (isBilibiliVideoPage()) {
      setTimeout(injectApp, 1000)
    }
  }
}).observe(document, { subtree: true, childList: true })
