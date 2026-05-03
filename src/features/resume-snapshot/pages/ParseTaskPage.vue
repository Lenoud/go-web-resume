<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { resumeParseTasks } from '@/client'
import type { ParseTaskSummary } from '@/client'

const router = useRouter()

const list = ref<ParseTaskSummary[]>([])
const loading = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const columns = [
  { title: '文件名', dataIndex: 'fileName', key: 'fileName' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '错误信息', dataIndex: 'msg', key: 'msg', ellipsis: true },
  { title: '操作', key: 'action', width: 120 },
]

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '等待中', color: 'default' },
  parsing: { label: '解析中', color: 'processing' },
  done: { label: '成功', color: 'success' },
  success: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'error' },
}

function getStatusTag(status: string) {
  return statusMap[status] || { label: status, color: 'default' }
}

async function fetchTasks() {
  loading.value = true
  try {
    const res = await resumeParseTasks()
    const data = res.data?.data
    list.value = Array.isArray(data) ? data : []
  } catch {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
  scheduleRefresh()
}

function scheduleRefresh() {
  stopRefresh()
  const hasActive = list.value.some(t => t.status === 'pending' || t.status === 'parsing')
  if (hasActive) {
    refreshTimer = setInterval(fetchTasks, 5000)
  }
}

function stopRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function goSnapshotList() {
  router.push('/index/usercenter/resumeManagementView')
}

onMounted(fetchTasks)
onUnmounted(stopRefresh)
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold m-0">
        解析状态
      </h2>
      <a-button
        :loading="loading"
        @click="fetchTasks"
      >
        刷新
      </a-button>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="taskId"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'fileName'">
          <span>{{ record.fileName || '-' }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusTag(record.status).color">
            <span
              v-if="record.status === 'pending' || record.status === 'parsing'"
              class="animate-pulse"
            >
              {{ getStatusTag(record.status).label }}
            </span>
            <span v-else>{{ getStatusTag(record.status).label }}</span>
          </a-tag>
        </template>
        <template v-else-if="column.key === 'msg'">
          <span class="text-gray-500 text-xs">{{ record.msg || '-' }}</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button
            v-if="record.status === 'done' || record.status === 'success'"
            type="link"
            size="small"
            @click="goSnapshotList"
          >
            查看快照
          </a-button>
          <span
            v-else
            class="text-gray-400 text-xs"
          >-</span>
        </template>
      </template>
    </a-table>

    <!-- 空状态 -->
    <div
      v-if="!loading && list.length === 0"
      class="text-center text-gray-400 py-12"
    >
      暂无解析记录
    </div>
  </div>
</template>
