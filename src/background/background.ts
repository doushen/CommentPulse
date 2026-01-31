// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('CommentPulse 已安装')
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_COMMENTS') {
    // 可以在这里处理评论数据的存储等
    sendResponse({ success: true })
  }
  return true
})
