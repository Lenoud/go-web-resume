<script setup lang="ts">
import { ref } from 'vue'
import { useOpLogTable, useLoginLogTable } from '../composables/useOpLog.js'

// 操作日志
const {
  list: opLogList, total: opLogTotal, loading: opLogLoading, page: opLogPage, pageSize: opLogPageSize, handlePageChange: opLogPageChange,
} = useOpLogTable()

// 登录日志
const {
  list: loginLogList, total: loginLogTotal, loading: loginLogLoading, page: loginLogPage, pageSize: loginLogPageSize, handlePageChange: loginLogPageChange,
} = useLoginLogTable()

// 当前激活的 Tab
const activeTab = ref('opLog')

// 操作日志列定义
const opLogColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 70, fixed: 'left' as const },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 80 },
  { title: '方法', dataIndex: 'reMethod', key: 'reMethod', width: 80 },
  { title: '路径', dataIndex: 'reUrl', key: 'reUrl', width: 260 },
  { title: 'IP', dataIndex: 'reIp', key: 'reIp', width: 140 },
  { title: '业务码', dataIndex: 'bizCode', key: 'bizCode', width: 80 },
  { title: '业务消息', dataIndex: 'bizMsg', key: 'bizMsg', width: 160, ellipsis: true },
  { title: '耗时(ms)', dataIndex: 'reResponseTime', key: 'reResponseTime', width: 90 },
  { title: '访问时间', dataIndex: 'reTime', key: 'reTime', width: 180 },
]

// 登录日志列定义
const loginLogColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 70, fixed: 'left' as const },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 80 },
  { title: '方法', dataIndex: 'reMethod', key: 'reMethod', width: 80 },
  { title: '路径', dataIndex: 'reUrl', key: 'reUrl', width: 260 },
  { title: 'IP', dataIndex: 'reIp', key: 'reIp', width: 140 },
  { title: '业务码', dataIndex: 'bizCode', key: 'bizCode', width: 80 },
  { title: '业务消息', dataIndex: 'bizMsg', key: 'bizMsg', width: 160, ellipsis: true },
  { title: 'User-Agent', dataIndex: 'reUserAgent', key: 'reUserAgent', width: 320, ellipsis: true },
  { title: '访问时间', dataIndex: 'reTime', key: 'reTime', width: 180 },
]
</script>

<template>
  <div class="p-6">
    <a-tabs v-model:activeKey="activeTab">
      <!-- 操作日志 Tab -->
      <a-tab-pane key="opLog" tab="操作日志">
        <a-table
          :columns="opLogColumns"
          :data-source="opLogList"
          :loading="opLogLoading"
          row-key="id"
          :scroll="{ x: 1200 }"
          :pagination="{ current: opLogPage, pageSize: opLogPageSize, total: opLogTotal, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
          @change="opLogPageChange"
        />
      </a-tab-pane>

      <!-- 登录日志 Tab -->
      <a-tab-pane key="loginLog" tab="登录日志">
        <a-table
          :columns="loginLogColumns"
          :data-source="loginLogList"
          :loading="loginLogLoading"
          row-key="id"
          :scroll="{ x: 1400 }"
          :pagination="{ current: loginLogPage, pageSize: loginLogPageSize, total: loginLogTotal, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
          @change="loginLogPageChange"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
