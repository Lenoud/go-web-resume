<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { resumeResumeDetail, resumeResumeUpdate } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { message } from 'ant-design-vue'

const auth = useAuthStore()
const queryClient = useQueryClient()

const detailQuery = useQuery({
  queryKey: queryKeys.resumes.detail(auth.userId),
  queryFn: async () => {
    const result = await resumeResumeDetail({ query: { userId: auth.userId } })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return resp.data
  },
  enabled: !!auth.userId,
})

const formState = ref<Record<string, string | undefined>>({})

watch(detailQuery.data, (data) => {
  if (data) {
    formState.value = { ...data }
  }
}, { immediate: true })

const sexOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
]

const saveMutation = useMutation({
  mutationFn: (body: Record<string, string | undefined>) =>
    resumeResumeUpdate({ body: body as Parameters<typeof resumeResumeUpdate>[0]['body'] }),
  onSuccess: () => {
    message.success('保存成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.resumes.detail(auth.userId) })
  },
  onError: (err: Error) => message.error(err.message || '保存失败'),
})

function handleSave() {
  saveMutation.mutate({ ...formState.value, userId: auth.userId })
}

const loading = computed(() => detailQuery.isLoading.value)
</script>

<template>
  <div class="bg-white rounded-lg p-6">
    <h2 class="text-lg font-medium mb-6">我的简历</h2>
    <a-spin :spinning="loading">
      <a-form :label-col="{ span: 4 }" class="max-w-2xl">
        <a-form-item label="姓名">
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="性别">
          <a-select v-model:value="formState.sex" :options="sexOptions" allow-clear placeholder="请选择" />
        </a-form-item>
        <a-form-item label="出生日期">
          <a-input v-model:value="formState.birthday" placeholder="如: 1990-01-01" />
        </a-form-item>
        <a-form-item label="学历">
          <a-input v-model:value="formState.education" />
        </a-form-item>
        <a-form-item label="学校">
          <a-input v-model:value="formState.school" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model:value="formState.mobile" />
        </a-form-item>
        <a-form-item label="个人简介">
          <a-textarea v-model:value="formState.summary" :rows="3" />
        </a-form-item>
        <a-form-item label="技能">
          <a-textarea v-model:value="formState.skills" :rows="3" />
        </a-form-item>
        <a-form-item label="工作经历">
          <a-textarea v-model:value="formState.experience" :rows="3" />
        </a-form-item>
        <a-form-item label="项目经历">
          <a-textarea v-model:value="formState.projects" :rows="3" />
        </a-form-item>
        <a-form-item label="期望薪资">
          <a-input v-model:value="formState.expectedSalary" />
        </a-form-item>
        <a-form-item label="求职意向">
          <a-input v-model:value="formState.jobIntention" />
        </a-form-item>
        <a-form-item :wrapper-col="{ offset: 4 }">
          <a-button type="primary" :loading="saveMutation.isPending.value" @click="handleSave">
            保存简历
          </a-button>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>
