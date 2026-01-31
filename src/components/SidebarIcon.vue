<template>
  <div 
    class="sidebar-icon" 
    :class="{ active: isActive }"
    @click="togglePanel"
    title="打开评论分析"
  >
    <el-icon :size="24">
      <ChatDotRound />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'

const props = defineProps<{
  isActive: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

function togglePanel() {
  emit('toggle')
}
</script>

<style scoped>
.sidebar-icon {
  position: fixed !important;
  right: 20px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 48px !important;
  height: 48px !important;
  background: #00a1d6 !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  z-index: 2147483647 !important;
  transition: all 0.3s ease !important;
  color: white !important;
  animation: fadeIn 0.5s ease-out !important;
}

.sidebar-icon:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 161, 214, 0.4);
}

.sidebar-icon:active {
  transform: translateY(-50%) scale(0.95);
}

.sidebar-icon.active {
  background: #ff6b6b;
  animation: pulse 2s infinite;
}
</style>
