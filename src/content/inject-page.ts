// CommentPulse 页面内脚本 - 用于 Shadow DOM 访问
// 这个脚本会注入到页面上下文中，可以访问 Shadow DOM

// 全局函数：提取评论
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
  console.log('[CommentPulse] Found ' + renderers.length + ' comment renderers');
  
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
        id: username + '-' + content.substring(0, 20) + '-' + Date.now() + '-' + Math.random(),
        username,
        content,
        likeCount,
        replyCount: 0,
        time
      });
    }
  }
  
  console.log('[CommentPulse] Extracted ' + comments.length + ' comments');
  return comments;
}

// 导出到全局
window.__commentpulse_extract = extractCommentsFromShadowDOM;

// 自动提取（延迟执行）
setTimeout(() => {
  const comments = extractCommentsFromShadowDOM();
  if (comments.length > 0) {
    localStorage.setItem('commentpulse_comments', JSON.stringify({
      comments: comments,
      time: Date.now()
    }));
    console.log('[CommentPulse] Saved ' + comments.length + ' comments to localStorage');
  }
}, 8000);
