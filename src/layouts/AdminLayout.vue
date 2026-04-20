<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  UserOutlined,
  LayoutOutlined,
  DollarOutlined,
  AppstoreOutlined,
  FolderOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/infrastructure/store/auth'
import { useAppStore } from '@/infrastructure/store/app'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const app = useAppStore()

const selectedKeys = computed(() => {
  const path = route.path
  const match = path.match(/^\/admin\/(\w+)/)
  return match?.[1] ? [match[1]] : ['job']
})

const menuItems = [
  { key: 'job', icon: () => h(DatabaseOutlined), label: '岗位管理' },
  { key: 'resume', icon: () => h(DatabaseOutlined), label: '简历管理' },
  { key: 'resumeSnapshot', icon: () => h(DatabaseOutlined), label: '简历快照' },
  { key: 'talentPool', icon: () => h(UserOutlined), label: '人才库' },
  { key: 'company', icon: () => h(DatabaseOutlined), label: '公司管理' },
  { key: 'user', icon: () => h(UserOutlined), label: '用户管理' },
  { key: 'department', icon: () => h(LayoutOutlined), label: '部门管理' },
  { key: 'offer', icon: () => h(DollarOutlined), label: 'Offer管理' },
  {
    key: 'logGroup',
    icon: () => h(FolderOutlined),
    label: '日志管理',
    children: [
      { key: 'opLog', icon: () => h(AppstoreOutlined), label: '操作/登录日志' },
    ],
  },
]

function handleMenuClick({ key }: { key: string | number }) {
  router.push(`/admin/${key}`)
}

function handleLogout() {
  auth.logout(true)
  router.push('/admin/login')
}

function handlePreview() {
  const resolved = router.resolve({ path: '/index/home' })
  window.open(resolved.href, '_blank')
}
</script>

<template>
  <a-layout class="min-h-screen">
    <!-- 暗色侧边栏 -->
    <a-layout-sider
      v-model:collapsed="app.sidebarCollapsed"
      collapsible
      :trigger="null"
      width="220"
      :style="{ background: 'var(--color-sidebar-bg)' }"
    >
      <div class="h-16 flex items-center justify-center border-b border-white/10">
        <h1 v-if="!app.sidebarCollapsed" class="text-lg font-bold text-white m-0">智慧招聘</h1>
        <h1 v-else class="text-base font-bold text-white m-0">招聘</h1>
      </div>
      <a-menu
        mode="inline"
        theme="dark"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
        :items="menuItems"
        :style="{ background: 'transparent', borderRight: 'none', paddingTop: '16px' }"
        class="admin-sidebar-menu"
      />
    </a-layout-sider>

    <a-layout>
      <!-- 顶栏 -->
      <a-layout-header class="bg-white px-6 flex items-center justify-between shadow-sm h-14 leading-14">
        <div class="flex items-center gap-4">
          <component
            :is="app.sidebarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            class="text-xl cursor-pointer text-text-secondary hover:text-primary transition-colors"
            @click="app.toggleSidebar()"
          />
        </div>
        <div class="flex items-center gap-4 text-sm">
          <a-button size="small" @click="handlePreview">
            <template #icon><EyeOutlined /></template>
            前台预览
          </a-button>
          <span class="text-text-secondary">管理员[{{ auth.adminUsername || 'admin' }}]</span>
          <a class="text-text-secondary hover:text-primary cursor-pointer transition-colors" @click="handleLogout">退出</a>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="m-4 p-6 bg-white rounded-lg min-h-0 overflow-auto">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
/* 暗色侧边栏菜单样式覆盖 */
:deep(.admin-sidebar-menu .ant-menu-item),
:deep(.admin-sidebar-menu .ant-menu-submenu-title) {
  color: var(--color-sidebar-text);
  margin: 4px 8px;
  border-radius: 6px;
}

:deep(.admin-sidebar-menu .ant-menu-item:hover),
:deep(.admin-sidebar-menu .ant-menu-submenu-title:hover) {
  color: var(--color-sidebar-active);
}

:deep(.admin-sidebar-menu .ant-menu-item-selected) {
  color: var(--color-sidebar-active) !important;
  background: rgba(59, 125, 216, 0.15) !important;
  position: relative;
}

:deep(.admin-sidebar-menu .ant-menu-item-selected::after) {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--color-primary);
}

:deep(.admin-sidebar-menu .ant-menu-sub) {
  background: transparent !important;
}

:deep(.admin-sidebar-menu .anticon) {
  color: inherit;
}
</style>

<!-- 全局覆盖 AntDV sider 暗色主题 -->
<style>
/* 确保 sider 整体背景统一，避免底部露出默认深灰色 */
.ant-layout-sider {
  background: var(--color-sidebar-bg) !important;
}
.ant-layout-sider .ant-layout-sider-children {
  background: var(--color-sidebar-bg) !important;
}
/* 覆盖 AntDV dark sider 底部 trigger 区域 */
.ant-layout-sider-dark {
  background: var(--color-sidebar-bg) !important;
}
</style>
