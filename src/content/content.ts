// Content script - Shadow DOM 兼容版本
console.log('CommentPulse: Content script loaded (Shadow DOM version)');

function isBilibiliVideoPage(): boolean {
  return window.location.hostname.includes('bilibili.com') && 
         window.location.pathname.startsWith('/video/');
}

// 查找 Shadow DOM 中的元素
function queryShadowDeep(selector: string, root: Document | Element = document): Element | null {
  // 先尝试普通选择器
  const normal = root.querySelector(selector);
  if (normal) return normal;
  
  // 递归查找 Shadow DOM
  const elements = root.querySelectorAll('*');
  for (const el of elements) {
    if (el.shadowRoot) {
      const found = queryShadowDeep(selector, el.shadowRoot);
      if (found) return found;
    }
  }
  return null;
}

// 查找所有 Shadow DOM 中的元素
function queryShadowAll(selector: string, root: Document | Element = document): Element[] {
  const results: Element[] = [];
  
  // 普通选择器
  root.querySelectorAll(selector).forEach(el => results.push(el));
  
  // 递归查找 Shadow DOM
  const elements = root.querySelectorAll('*');
  for (const el of elements) {
    if (el.shadowRoot) {
      results.push(...queryShadowAll(selector, el.shadowRoot));
    }
  }
  
  return results;
}

// 提取评论数据（处理 Shadow DOM）
function extractComments(): any[] {
  const comments: any[] = [];
  
  // 查找所有 bili-comment-renderer
  const commentRenderers = queryShadowAll('bili-comment-renderer');
  console.log(`CommentPulse: 找到 ${commentRenderers.length} 个 bili-comment-renderer`);
  
  for (const renderer of commentRenderers) {
    try {
      // 进入 shadowRoot
      const shadowRoot = renderer.shadowRoot;
      if (!shadowRoot) continue;
      
      // 获取 body
      const body = shadowRoot.querySelector('#body');
      if (!body) continue;
      
      // 获取用户名
      const userNameEl = body.querySelector('#user-name a');
      const username = userNameEl?.textContent?.trim() || '匿名用户';
      
      // 获取评论内容
      const contentEl = body.querySelector('#content');
      const content = contentEl?.textContent?.trim() || '';
      
      // 获取点赞数
      const likeEl = body.querySelector('#like #count');
      const likeText = likeEl?.textContent?.trim() || '0';
      const likeCount = parseInt(likeText) || 0;
      
      // 获取时间
      const timeEl = body.querySelector('#pubdate');
      const time = timeEl?.textContent?.trim() || '';
      
      if (content && content.length > 2) {
        comments.push({
          id: `${username}-${content.substring(0, 20)}-${Date.now()}-${Math.random()}`,
          username,
          content,
          likeCount,
          replyCount: 0,
          time
        });
      }
    } catch (error) {
      console.error('CommentPulse: 提取评论失败', error);
    }
  }
  
  return comments;
}

// 发送评论数据到 popup
function sendCommentsToPopup() {
  const comments = extractComments();
  console.log(`CommentPulse: 提取了 ${comments.length} 条评论`);
  
  // 发送消息到 popup（如果 popup 打开着）
  chrome.runtime.sendMessage({
    type: 'COMMENTS_EXTRACTED',
    comments: comments
  }).catch(() => {
    // Popup 可能没打开，忽略错误
  });
  
  // 保存到 storage，供 popup 读取
  if (comments.length > 0) {
    chrome.storage.local.set({ 
      extractedComments: comments,
      lastExtractTime: Date.now()
    });
  }
  
  return comments;
}

// 注入脚本到 Shadow DOM
function injectScript() {
  if (document.getElementById('commentpulse-injected')) {
    return;
  }
  
  const script = document.createElement('script');
  script.id = 'commentpulse-injected';
  script.textContent = `
    // Shadow DOM 兼容的评论提取脚本
    function extractCommentsFromShadowDOM() {
      const comments = [];
      
      function queryShadowAll(selector, root = document) {
        const results = [];
        root.querySelectorAll(selector).forEach(el => results.push(el));
        root.querySelectorAll('*').forEach(el => {
          if (el.shadowRoot) {
            results.push(...queryShadowAll(selector, el.shadowRoot));
          }
        });
        return results;
      }
      
      const renderers = queryShadowAll('bili-comment-renderer');
      console.log('Found ' + renderers.length + ' comment renderers');
      
      for (const renderer of renderers) {
        if (!renderer.shadowRoot) continue;
        
        const body = renderer.shadowRoot.querySelector('#body');
        if (!body) continue;
        
        const userNameEl = body.querySelector('#user-name a');
        const username = userNameEl?.textContent?.trim() || '匿名';
        
        const contentEl = body.querySelector('#content');
        const content = contentEl?.textContent?.trim() || '';
        
        const likeEl = body.querySelector('#like #count');
        const likeCount = parseInt(likeEl?.textContent?.trim() || '0') || 0;
        
        const timeEl = body.querySelector('#pubdate');
        const time = timeEl?.textContent?.trim() || '';
        
        if (content && content.length > 2) {
          comments.push({
            id: username + '-' + content.substring(0, 20) + '-' + Date.now(),
            username,
            content,
            likeCount,
            replyCount: 0,
            time
          });
        }
      }
      
      return comments;
    }
    
    // 导出到全局
    window.__commentpulse_extract = extractCommentsFromShadowDOM;
  `;
  
  document.head.appendChild(script);
  console.log('CommentPulse: 注入脚本到 Shadow DOM');
}

// 等待页面加载完成后注入
function init() {
  if (!isBilibiliVideoPage()) return;
  
  console.log('CommentPulse: 初始化...');
  
  // 延迟注入，确保 Shadow DOM 已创建
  setTimeout(() => {
    injectScript();
    
    // 5秒后尝试提取评论
    setTimeout(() => {
      const comments = extractComments();
      console.log(`CommentPulse: 提取了 ${comments.length} 条评论`);
      
      if (comments.length > 0) {
        chrome.storage.local.set({ 
          extractedComments: comments,
          lastExtractTime: Date.now()
        });
      }
    }, 5000);
  }, 2000);
}

// 监听页面变化
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isBilibiliVideoPage()) {
      setTimeout(init, 2000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_COMMENTS') {
    const comments = extractComments();
    sendResponse({ 
      success: true, 
      comments: comments,
      count: comments.length 
    });
  }
  return true;
});

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
