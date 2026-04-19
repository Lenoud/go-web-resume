import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ── 侧边栏 ──
  const sidebarCollapsed = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // ── 主题 ──
  const theme = ref<'light' | 'dark'>('light')

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
    theme,
    setTheme,
  }
})
