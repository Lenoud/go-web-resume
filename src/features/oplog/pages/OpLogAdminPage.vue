<script setup lang="ts">
import { ref } from 'vue'
import { useOpLogTable, useLoginLogTable } from '../composables/useOpLog.js'

// 操作日志
const {
  list: opLogList, total: opLogTotal, loading: opLogLoading, page: opLogPage, pageSize: opLogPageSize,
} = useOpLogTable()

// 登录日志
const {
  list: loginLogList, total: loginLogTotal, loading: loginLogLoading, page: loginLogPage, pageSize: loginLogPageSize,
} = useLoginLogTable()

// 当前激活的 Tab
const activeTab = ref('opLog')

// 操作日志列定义
const opLogColumns = [
  { title: '请求方法', dataIndex: 'reMethod', key: 'reMethod', width: 100 },
  { title: '请求路径', dataIndex: 'reUrl', key: 'reUrl', ellipsis: true },
  { title: 'IP地址', dataIndex: 'reIp', key: 'reIp', width: 140 },
  { title: '业务码', dataIndex: 'bizCode', key: 'bizCode', width: 80 },
  { title: '业务消息', dataIndex: 'bizMsg', key: 'bizMsg', ellipsis: true },
  { title: '请求内容', dataIndex: 'reContent', key: 'reContent', ellipsis: true, width: 200 },
  { title: '访问时间', dataIndex: 'accessTime', key: 'accessTime', width: 180 },
]

// 登录日志列定义
const loginLogColumns = [
  { title: '请求方法', dataIndex: 'reMethod', key: 'reMethod', width: 100 },
  { title: '请求路径', dataIndex: 'reUrl', key: 'reUrl', ellipsis: true },
  { title: 'IP地址', dataIndex: 'reIp', key: 'reIp', width: 140 },
  { title: '业务码', dataIndex: 'bizCode', key: 'bizCode', width: 80 },
  { title: '业务消息', dataIndex: 'bizMsg', key: 'bizMsg', ellipsis: true },
  { title: '请求内容', dataIndex: 'reContent', key: 'reContent', ellipsis: true, width: 200 },
  { title: '访问时间', dataIndex: 'accessTime', key: 'accessTime', width: 180 },
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
          :pagination="{ current: opLogPage, pageSize: opLogPageSize, total: opLogTotal, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
          @change="(pag: any) => { opLogPage = pag.current; opLogPageSize = pag.pageSize }"
        />
      </a-tab-pane>

      <!-- 登录日志 Tab -->
      <a-tab-pane key="loginLog" tab="登录日志">
        <a-table
          :columns="loginLogColumns"
          :data-source="loginLogList"
          :loading="loginLogLoading"
          row-key="id"
          :pagination="{ current: loginLogPage, pageSize: loginLogPageSize, total: loginLogTotal, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
          @change="(pag: any) => { loginLogPage = pag.current; loginLogPageSize = pag.pageSize }"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
