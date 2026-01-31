// CommentPulse 页面内脚本 - 支持新版 B站 Shadow DOM 结构
// 同时负责：1.评论提取 2.UI 注入

// ========== 1. 评论提取功能 ==========
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
  
  const commentsEl = document.querySelector('BILI-COMMENTS');
  if (!commentsEl || !commentsEl.shadowRoot) {
    console.log('[CommentPulse] 未找到 BILI-COMMENTS');
    return [];
  }
  
  const threads = commentsEl.shadowRoot.querySelectorAll('bili-comment-thread-renderer');
  console.log('[CommentPulse] 找到 ' + threads.length + ' 个评论线程');
  
  let emptyCount = 0;
  
  threads.forEach((thread, index) => {
    if (!thread.shadowRoot) return;
    const renderer = thread.shadowRoot.querySelector('bili-comment-renderer');
    if (!renderer || !renderer.shadowRoot) return;
    
    // 获取用户名
    let username = '匿名';
    const userInfo = renderer.shadowRoot.querySelector('bili-comment-user-info');
    if (userInfo && userInfo.shadowRoot) {
      const nameEl = userInfo.shadowRoot.querySelector('#user-name a');
      username = nameEl?.textContent?.trim() || '匿名';
    }
    
    // 获取评论内容 - 多重尝试
    let content = '';
    
    // 方法1: #content
    const contentDiv = renderer.shadowRoot.querySelector('#content');
    if (contentDiv) {
      content = contentDiv.textContent?.trim() || '';
    }
    
    // 方法2: BILI-RICH-TEXT
    if (!content) {
      const richText = renderer.shadowRoot.querySelector('bili-rich-text');
      if (richText) {
        content = richText.textContent?.trim() || '';
      }
    }
    
    // 方法3: #body 里的所有文本
    if (!content) {
      const body = renderer.shadowRoot.querySelector('#body');
      if (body) {
        // 排除用户名、时间等非内容文本
        const allText = body.textContent || '';
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        // 过滤掉太短的、只包含数字的、包含"置顶"的
        content = lines.find(l => 
          l.length > 5 && 
          !l.match(/^\d+$/) && 
          !l.includes('置顶') &&
          !l.includes('赞') &&
          !l.includes('回复') &&
          !l.match(/^\d{4}-\d{2}-\d{2}/)
        ) || '';
      }
    }
    
    // 获取点赞数
    let likeCount = 0;
    const actionBtns = renderer.shadowRoot.querySelector('bili-comment-action-buttons-renderer');
    if (actionBtns && actionBtns.shadowRoot) {
      const likeEl = actionBtns.shadowRoot.querySelector('#like');
      if (likeEl) {
        const likeText = likeEl.textContent?.trim() || '0';
        likeCount = parseInt(likeText) || 0;
      }
    }
    
    // 获取时间
    let time = '';
    const timeEl = renderer.shadowRoot.querySelector('#pubdate');
    if (timeEl) time = timeEl.textContent?.trim() || '';
    
    // 只过滤空内容和"置顶"
    if (content && content.length > 2 && !content.includes('置顶')) {
      comments.push({
        id: username + '-' + content.substring(0, 15) + '-' + index + '-' + Date.now(),
        username: username.substring(0, 20),
        content: content.substring(0, 500),
        likeCount,
        replyCount: 0,
        time
      });
    } else {
      emptyCount++;
    }
  });
  
  console.log('[CommentPulse] 提取了 ' + comments.length + ' 条评论，' + emptyCount + ' 条被过滤');
  return comments;
}

// ========== 2. UI 注入功能 ==========
function injectUI() {
  if (document.getElementById('commentpulse-ui')) {
    return;
  }
  
  console.log('[CommentPulse] 注入 UI...');
  
  const container = document.createElement('div');
  container.id = 'commentpulse-ui';
  container.innerHTML = `
    <div id="commentpulse-sidebar">
      <div id="commentpulse-toggle">🐝</div>
      <div id="commentpulse-panel" style="display:none;">
        <div class="cp-header">
          <span>🐝 蜂巢评论分析</span>
          <button id="cp-close">×</button>
        </div>
        <div class="cp-content">
          <div id="cp-stats">正在分析...</div>
          <div id="cp-comments"></div>
        </div>
      </div>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    #commentpulse-sidebar {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 999999;
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
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    #commentpulse-toggle:hover {
      transform: scale(1.1);
    }
    #commentpulse-panel {
      position: absolute;
      right: 50px;
      top: 50%;
      transform: translateY(-50%);
      width: 350px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .cp-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cp-header button {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
    }
    .cp-content {
      padding: 15px;
      max-height: 400px;
      overflow-y: auto;
    }
    #cp-stats {
      margin-bottom: 15px;
      padding: 10px;
      background: #f0f4ff;
      border-radius: 8px;
      font-size: 13px;
    }
    .cp-comment {
      padding: 10px;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    .cp-comment:last-child {
      border-bottom: none;
    }
    .cp-comment .user {
      font-weight: bold;
      color: #667eea;
    }
    .cp-comment .content {
      margin: 5px 0;
      color: #333;
    }
    .cp-comment .meta {
      color: #999;
      font-size: 11px;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(container);
  
  document.getElementById('commentpulse-toggle').onclick = () => {
    const panel = document.getElementById('commentpulse-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
      showAnalysis();
    }
  };
  document.getElementById('cp-close').onclick = () => {
    document.getElementById('commentpulse-panel').style.display = 'none';
  };
  
  console.log('[CommentPulse] UI 注入完成');
}

// 显示分析结果
function showAnalysis() {
  // 首先尝试提取新数据
  let comments = extractCommentsFromShadowDOM();
  
  // 如果提取不到，尝试使用历史数据
  if (comments.length === 0) {
    const saved = localStorage.getItem('commentpulse_comments');
    if (saved) {
      const data = JSON.parse(saved);
      comments = data.comments || [];
      console.log('[CommentPulse] 使用历史数据: ' + comments.length + ' 条');
    }
  }
  
  const statsDiv = document.getElementById('cp-stats');
  const commentsDiv = document.getElementById('cp-comments');
  
  if (comments.length === 0) {
    statsDiv.textContent = '未找到评论数据';
    return;
  }
  
  // 统计
  const total = comments.length;
  const avgLikes = Math.round(comments.reduce((sum, c) => sum + (c.likeCount || 0), 0) / total);
  
  statsDiv.innerHTML = `
    <strong>评论分析</strong><br>
    共 ${total} 条评论<br>
    平均点赞 ${avgLikes}
  `;
  
  commentsDiv.innerHTML = comments.slice(0, 20).map(c => `
    <div class="cp-comment">
      <div class="user">${c.username || '匿名'}</div>
      <div class="content">${(c.content || '').substring(0, 100)}${(c.content || '').length > 100 ? '...' : ''}</div>
      <div class="meta">👍 ${c.likeCount || 0}</div>
    </div>
  `).join('');
}

// ========== 3. 初始化 ==========
console.log('[CommentPulse] 初始化...');

// 延迟注入 UI
setTimeout(() => {
  injectUI();
}, 2000);

// 延迟提取评论
setTimeout(() => {
  const comments = extractCommentsFromShadowDOM();
  if (comments.length > 0) {
    localStorage.setItem('commentpulse_comments', JSON.stringify({
      comments: comments,
      time: Date.now()
    }));
    console.log('[CommentPulse] 保存 ' + comments.length + ' 条评论到 localStorage');
  }
}, 10000);

// 导出到全局
window.__commentpulse_extract = extractCommentsFromShadowDOM;
window.__commentpulse_showUI = injectUI;
window.__commentpulse_showAnalysis = showAnalysis;
