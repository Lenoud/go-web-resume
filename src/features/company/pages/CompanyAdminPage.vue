<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import { companyCompanyList, companyCompanyCreate, companyCompanyUpdate } from '@/client'
import type { CompanyInfo } from '../composables/useCompany'

import { queryKeys } from '@/infrastructure/query/query-keys'

const queryClient = useQueryClient()

// ── 查询单条公司信息 ──
const { data: listData, isLoading: loading } = useQuery({
  queryKey: queryKeys.companies.all,
  queryFn: async () => {
    const result = await companyCompanyList({ query: { page: 1, pageSize: 1 } })
    return result.data?.data
  },
})

const company = computed(() => {
  const items = (listData.value as { list?: CompanyInfo[] })?.list ?? []
  return items.length > 0 ? items[0] : null
})
const hasCompany = computed(() => !!company.value)

// ── 创建 / 更新 mutation ──
const saveMutation = useMutation({
  mutationFn: async (body: Partial<CompanyInfo> & { id?: string }) => {
    if (body.id) {
      return companyCompanyUpdate({ body: body as Parameters<typeof companyCompanyUpdate>[0]['body'] })
    }
    return companyCompanyCreate({ body: body as Parameters<typeof companyCompanyCreate>[0]['body'] })
  },
  onSuccess: () => {
    message.success('保存成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    modalVisible.value = false
  },
  onError: (err: Error) => message.error(err.message || '保存失败'),
})

// ── 弹窗状态 ──
const modalVisible = ref(false)
const editingId = ref<string | null>(null)
const formState = ref<Partial<CompanyInfo>>({ title: '' })

const modalTitle = computed(() => (editingId.value ? '编辑公司信息' : '初始化公司资料'))

function openCreate() {
  editingId.value = null
  formState.value = { title: '' }
  modalVisible.value = true
}

function openEdit() {
  if (!company.value) return
  editingId.value = company.value.id ?? null
  formState.value = { ...company.value }
  modalVisible.value = true
}

function handleSubmit() {
  const payload = { ...formState.value }
  if (editingId.value) {
    payload.id = editingId.value
  }
  saveMutation.mutate(payload)
}

// 表格列定义
const columns = [
  { title: '公司名称', dataIndex: 'title', key: 'title' },
  { title: '规模', dataIndex: 'guimo', key: 'guimo' },
  { title: '行业', dataIndex: 'hangye', key: 'hangye' },
  { title: '地点', dataIndex: 'location', key: 'location' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-button v-if="!hasCompany" type="primary" @click="openCreate">
          初始化公司资料
        </a-button>
      </div>
    </div>

    <!-- 表格 — 单公司，不分页 -->
    <a-table
      :columns="columns"
      :data-source="company ? [company] : []"
      :loading="loading"
      row-key="id"
      :pagination="false"
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column }">
        <template v-if="column.key === 'action'">
          <a-button type="link" @click="openEdit">
            编辑
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="公司名称" required>
          <a-input v-model:value="formState.title" placeholder="请输入公司名称" />
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="formState.location" placeholder="请输入地点" />
        </a-form-item>
        <a-form-item label="行业">
          <a-input v-model:value="formState.hangye" placeholder="请输入行业" />
        </a-form-item>
        <a-form-item label="规模">
          <a-input v-model:value="formState.guimo" placeholder="请输入规模" />
        </a-form-item>
        <a-form-item label="简介">
          <a-textarea v-model:value="formState.description" :rows="3" placeholder="请输入公司简介" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
