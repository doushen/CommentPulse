<template>
  <div class="analysis-panel" v-if="visible">
    <div class="panel-header">
      <h3>评论分析</h3>
      <el-button 
        text 
        @click="close"
        :icon="Close"
        circle
      />
    </div>
    
    <div class="panel-content" v-loading="loading">
      <div v-if="!loading && analysisData">
        <!-- 情绪分析 -->
        <EmotionChart :stats="analysisData.emotionStats" />
        
        <!-- 词云 -->
        <WordCloud :words="analysisData.wordCloud" />
        
        <!-- 精选评论 -->
        <TopComments :comments="analysisData.topComments" />
        
        <!-- AI建议 -->
        <AISuggestion 
          :suggestion="analysisData.aiSuggestion"
          @generate="handleGenerateSuggestion"
        />
      </div>
      
      <div v-else-if="!loading && !analysisData" class="empty-state">
        <p>暂无数据</p>
        <el-button type="primary" @click="startAnalysis">开始分析</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'
import EmotionChart from './EmotionChart.vue'
import WordCloud from './WordCloud.vue'
import TopComments from './TopComments.vue'
import AISuggestion from './AISuggestion.vue'
import { CommentScraper } from '@/utils/commentScraper'
import { analyzeCommentsSentiment, calculateEmotionStats } from '@/utils/sentiment'
import { extractKeywords } from '@/utils/wordCloud'
import { filterTopComments } from '@/utils/commentFilter'
import { generateAISuggestion } from '@/utils/aiSuggestion'
import type { Comment, EmotionStats, WordCloudItem, TopComment, AISuggestion as AISuggestionType } from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(false)
const analysisData = ref<{
  emotionStats: EmotionStats
  wordCloud: WordCloudItem[]
  topComments: TopComment[]
  aiSuggestion: AISuggestionType | null
} | null>(null)

const scraper = new CommentScraper()

function close() {
  emit('close')
}

async function startAnalysis() {
  loading.value = true
  
  try {
    // 1. 抓取评论
    const comments = await scraper.startScraping()
    
    if (comments.length === 0) {
      alert('未找到评论，请确保页面已加载评论区域')
      loading.value = false
      return
    }
    
    // 2. 情感分析
    const analyzedComments = await analyzeCommentsSentiment(comments)
    const emotionStats = calculateEmotionStats(analyzedComments)
    
    // 3. 生成词云
    const wordCloud = extractKeywords(analyzedComments)
    
    // 4. 筛选精选评论
    const topComments = filterTopComments(analyzedComments)
    
    // 5. 生成AI建议
    const aiSuggestion = await generateAISuggestion(analyzedComments, emotionStats, topComments)
    
    analysisData.value = {
      emotionStats,
      wordCloud,
      topComments,
      aiSuggestion
    }
  } catch (error) {
    console.error('分析失败:', error)
    alert('分析失败，请重试')
  } finally {
    loading.value = false
  }
}

async function handleGenerateSuggestion() {
  if (!analysisData.value) return
  
  loading.value = true
  try {
    const comments = scraper.getComments()
    const aiSuggestion = await generateAISuggestion(
      comments,
      analysisData.value.emotionStats,
      analysisData.value.topComments
    )
    analysisData.value.aiSuggestion = aiSuggestion
  } catch (error) {
    console.error('生成建议失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 延迟开始分析，等待页面完全加载
  setTimeout(() => {
    startAnalysis()
  }, 2000)
})
</script>

<style scoped>
.analysis-panel {
  position: fixed;
  right: 80px;
  top: 50%;
  transform: translateY(-50%);
  width: 500px;
  max-height: 80vh;
  /* background: var(--bg-color); */
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 2147483647 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  animation: slideInRight 0.3s ease-out;
  transition: var(--transition);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color);
}

.empty-state p {
  margin-bottom: 20px;
  color: #999;
}
</style>
