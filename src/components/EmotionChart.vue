<template>
  <div class="emotion-chart">
    <h4>情绪分析</h4>
    <div ref="chartContainer" class="chart-container"></div>
    <div class="emotion-stats">
      <div class="stat-item positive">
        <span class="stat-label">积极</span>
        <span class="stat-value">{{ positivePercent }}%</span>
      </div>
      <div class="stat-item neutral">
        <span class="stat-label">中性</span>
        <span class="stat-value">{{ neutralPercent }}%</span>
      </div>
      <div class="stat-item negative">
        <span class="stat-label">消极</span>
        <span class="stat-value">{{ negativePercent }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { EmotionStats } from '@/types'

const props = defineProps<{
  stats: EmotionStats
}>()

const chartContainer = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const total = computed(() => {
  return props.stats.positive + props.stats.neutral + props.stats.negative
})

const positivePercent = computed(() => {
  return total.value > 0 ? Math.round((props.stats.positive / total.value) * 100) : 0
})

const neutralPercent = computed(() => {
  return total.value > 0 ? Math.round((props.stats.neutral / total.value) * 100) : 0
})

const negativePercent = computed(() => {
  return total.value > 0 ? Math.round((props.stats.negative / total.value) * 100) : 0
})

function initChart() {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      show: false
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { 
            value: props.stats.positive, 
            name: '积极',
            itemStyle: { color: '#52c41a' }
          },
          { 
            value: props.stats.neutral, 
            name: '中性',
            itemStyle: { color: '#faad14' }
          },
          { 
            value: props.stats.negative, 
            name: '消极',
            itemStyle: { color: '#ff4d4f' }
          }
        ]
      }
    ]
  }

  chartInstance.setOption(option)
}

function updateChart() {
  if (!chartInstance) return

  chartInstance.setOption({
    series: [{
      data: [
        { 
          value: props.stats.positive, 
          name: '积极',
          itemStyle: { color: '#52c41a' }
        },
        { 
          value: props.stats.neutral, 
          name: '中性',
          itemStyle: { color: '#faad14' }
        },
        { 
          value: props.stats.negative, 
          name: '消极',
          itemStyle: { color: '#ff4d4f' }
        }
      ]
    }]
  })
}

onMounted(() => {
  initChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

watch(() => props.stats, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
.emotion-chart {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-out;
}

.emotion-chart h4 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.chart-container {
  width: 100%;
  height: 250px;
  margin-bottom: 16px;
}

.emotion-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.stat-item {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item.positive {
  background: rgba(82, 196, 26, 0.1);
}

.stat-item.neutral {
  background: rgba(250, 173, 20, 0.1);
}

.stat-item.negative {
  background: rgba(255, 77, 79, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}
</style>
