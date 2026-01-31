<template>
  <div class="word-cloud">
    <h4>关键词词云</h4>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import type { WordCloudItem } from '@/types'

const props = defineProps<{
  words: WordCloudItem[]
}>()

const chartContainer = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartContainer.value || props.words.length === 0) return

  chartInstance = echarts.init(chartContainer.value)

  const option = {
    tooltip: {
      show: true
    },
    series: [
      {
        type: 'wordCloud',
        gridSize: 2,
        sizeRange: [12, 40],
        rotationRange: [-90, 90],
        shape: 'circle',
        width: '100%',
        height: '100%',
        drawOutOfBound: true,
        textStyle: {
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: function() {
            return 'rgb(' + [
              Math.round(Math.random() * 160 + 50),
              Math.round(Math.random() * 160 + 50),
              Math.round(Math.random() * 160 + 50)
            ].join(',') + ')'
          }
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        data: props.words
      }
    ]
  }

  chartInstance.setOption(option)
}

function updateChart() {
  if (!chartInstance || props.words.length === 0) return

  chartInstance.setOption({
    series: [{
      data: props.words
    }]
  })
}

onMounted(() => {
  initChart()
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

watch(() => props.words, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
.word-cloud {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-out 0.1s both;
}

.word-cloud h4 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.chart-container {
  width: 100%;
  height: 300px;
  background: #fafafa;
  border-radius: 8px;
}
</style>
