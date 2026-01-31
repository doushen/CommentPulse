<template>
  <div class="ai-suggestion">
    <div class="suggestion-header">
      <h4>AI回应建议</h4>
      <el-button 
        type="primary" 
        size="small"
        @click="handleGenerate"
        :loading="generating"
      >
        生成建议
      </el-button>
    </div>
    
    <div v-if="suggestion" class="suggestion-content">
      <div class="summary">
        <h5>整体分析</h5>
        <p>{{ suggestion.summary }}</p>
      </div>
      
      <div class="key-points" v-if="suggestion.keyPoints.length > 0">
        <h5>关键要点</h5>
        <ul>
          <li v-for="(point, index) in suggestion.keyPoints" :key="index">
            {{ point }}
          </li>
        </ul>
      </div>
      
      <div class="suggested-response">
        <h5>建议回应（30秒版本）</h5>
        <div class="response-text">
          {{ suggestion.suggestedResponse }}
        </div>
        <el-button 
          text 
          @click="copyResponse"
          style="margin-top: 8px;"
        >
          <el-icon><DocumentCopy /></el-icon>
          复制回应
        </el-button>
      </div>
    </div>
    
    <div v-else class="empty-suggestion">
      <p>点击"生成建议"获取AI生成的回应建议</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { AISuggestion as AISuggestionType } from '@/types'

const props = defineProps<{
  suggestion: AISuggestionType | null
}>()

const emit = defineEmits<{
  (e: 'generate'): void
}>()

const generating = ref(false)

function handleGenerate() {
  generating.value = true
  emit('generate')
  setTimeout(() => {
    generating.value = false
  }, 500)
}

function copyResponse() {
  if (!props.suggestion) return
  
  navigator.clipboard.writeText(props.suggestion.suggestedResponse).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.ai-suggestion {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-out 0.3s both;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.suggestion-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.suggestion-content {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.suggestion-content h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.summary {
  margin-bottom: 16px;
}

.summary p {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
}

.key-points {
  margin-bottom: 16px;
}

.key-points ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-color);
}

.key-points li {
  margin-bottom: 4px;
  line-height: 1.6;
}

.suggested-response {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.response-text {
  background: white;
  padding: 12px;
  border-radius: 6px;
  color: var(--text-color);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-suggestion {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
</style>
