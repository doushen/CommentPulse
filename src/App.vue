<template>
  <div id="commentpulse-root">
    <SidebarIcon 
      :isActive="panelVisible"
      @toggle="togglePanel"
    />
    <AnalysisPanel 
      v-if="panelVisible"
      :visible="panelVisible"
      @close="closePanel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SidebarIcon from './components/SidebarIcon.vue'
import AnalysisPanel from './components/AnalysisPanel.vue'

const panelVisible = ref(false)

function togglePanel() {
  panelVisible.value = !panelVisible.value
}

function closePanel() {
  panelVisible.value = false
}
</script>

<style>
#commentpulse-root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
