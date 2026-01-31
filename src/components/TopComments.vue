<template>
  <div class="top-comments">
    <h4>最需关注的评论</h4>
    <div class="comments-list">
      <el-card 
        v-for="(item, index) in comments" 
        :key="index"
        class="comment-card"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <el-tag :type="getTagType(item.type)">
              {{ getTypeLabel(item.type) }}
            </el-tag>
            <span class="username">{{ item.comment.username }}</span>
          </div>
        </template>
        
        <div class="comment-content">
          <p>{{ item.comment.content }}</p>
        </div>
        
        <div class="comment-footer">
          <div class="comment-meta">
            <el-icon><Star /></el-icon>
            <span>{{ item.comment.likeCount }}</span>
            <el-icon style="margin-left: 12px;"><ChatDotRound /></el-icon>
            <span>{{ item.comment.replyCount }}</span>
          </div>
          <div class="comment-reason">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ item.reason }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Star, ChatDotRound, InfoFilled } from '@element-plus/icons-vue'
import type { TopComment } from '@/types'

const props = defineProps<{
  comments: TopComment[]
}>()

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    question: '最高赞提问',
    suggestion: '建设性意见',
    emotion: '情绪宣泄'
  }
  return labels[type] || type
}

function getTagType(type: string): string {
  const types: Record<string, string> = {
    question: 'warning',
    suggestion: 'success',
    emotion: 'info'
  }
  return types[type] || ''
}
</script>

<style scoped>
.top-comments {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-out 0.2s both;
}

.top-comments h4 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.comment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
  color: var(--text-color);
}

.comment-content {
  margin: 12px 0;
  color: var(--text-color);
  line-height: 1.6;
}

.comment-content p {
  margin: 0;
  word-break: break-word;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}

.comment-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
  flex: 1;
  margin-left: 12px;
}
</style>
