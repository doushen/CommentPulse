// Content script - Shadow DOM 兼容版本（无内联脚本）
console.log('CommentPulse: Content script loaded (Shadow DOM version)');

function isBilibiliVideoPage(): boolean {
  return window.location.hostname.includes('bilibili.com') && 
         window.location.pathname.startsWith('/video/');
}

// 查找 Shadow DOM 中的元素
function queryShadowDeep(selector: string, root: Document | Element = document): Element | null {
  const normal = root.querySelector(selector);
  if (normal) return normal;
  
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
  root.querySelectorAll(selector).forEach(el => results.push(el));
  const elements = root.querySelectorAll('*');
  for (const el of elements) {
    if (el.shadowRoot) {
      results.push(...queryShadowAll(selector, el.shadowRoot));
    }
  }
  return results;
}

// 提取评论数据
function extractComments(): any[] {
  const comments: any[] = [];
  const commentRenderers = queryShadowAll('bili-comment-renderer');
  console.log(`CommentPulse: 找到 ${commentRenderers.length} 个 bili-comment-renderer`);
  
  for (const renderer of commentRenderers) {
    try {
      const shadowRoot = renderer.shadowRoot;
      if (!shadowRoot) continue;
      
      const body = shadowRoot.querySelector('#body');
      if (!body) continue;
      
      const userNameEl = body.querySelector('#user-name a');
      const username = userNameEl?.textContent?.trim() || '匿名用户';
      
      const contentEl = body.querySelector('#content');
      const content = contentEl?.textContent?.trim() || '';
      
      const likeEl = body.querySelector('#like #count');
      const likeCount = parseInt(likeEl?.textContent?.trim() || '0') || 0;
      
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

// 注入外部脚本到页面
function injectExternalScript() {
  if (document.getElementById('commentpulse-injected')) {
    console.log('CommentPulse: 脚本已注入，跳过');
    return;
  }
  
  // 获取扩展内的脚本 URL
  const scriptUrl = chrome.runtime.getURL('js/inject-page.js');
  
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.id = 'commentpulse-injected';
  script.type = 'text/javascript';
  
  script.onload = () => {
    console.log('CommentPulse: 外部脚本加载成功');
  };
  
  script.onerror = (error) => {
    console.error('CommentPulse: 外部脚本加载失败', error);
  };
  
  document.head.appendChild(script);
  console.log('CommentPulse: 尝试加载外部脚本:', scriptUrl);
}

// 初始化
function init() {
  if (!isBilibiliVideoPage()) {
    console.log('CommentPulse: 不是B站视频页面，跳过');
    return;
  }
  
  console.log('CommentPulse: 初始化...');
  
  // 延迟注入，确保页面结构就绪
  setTimeout(() => {
    injectExternalScript();
    
    // 延迟提取评论
    setTimeout(() => {
      const comments = extractComments();
      console.log(`CommentPulse: 提取了 ${comments.length} 条评论`);
      
      if (comments.length > 0) {
        chrome.storage.local.set({ 
          extractedComments: comments,
          lastExtractTime: Date.now()
        });
        console.log('CommentPulse: 评论已保存到 storage');
      }
    }, 5000);
  }, 2000);
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_COMMENTS') {
    const comments = extractComments();
    chrome.storage.local.set({ 
      extractedComments: comments,
      lastExtractTime: Date.now()
    });
    sendResponse({ 
      success: true, 
      comments: comments,
      count: comments.length 
    });
  }
  if (message.type === 'GET_COMMENTS') {
    chrome.storage.local.get(['extractedComments'], (result) => {
      sendResponse({ 
        comments: result.extractedComments || [],
        count: (result.extractedComments || []).length
      });
    });
  }
  return true;
});

// 监听页面变化（B站 SPA）
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isBilibiliVideoPage()) {
      console.log('CommentPulse: 页面变化，重新初始化');
      setTimeout(init, 2000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
