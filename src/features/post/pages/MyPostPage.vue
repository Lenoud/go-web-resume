<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { postPostUserList } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import RecruitmentStatusTag from '../components/RecruitmentStatusTag.vue'

const auth = useAuthStore()
const page = ref(1)
const pageSize = ref(10)

const listQuery = useQuery({
  queryKey: queryKeys.posts.userPosts(auth.userId, { page: page.value, pageSize: pageSize.value }),
  queryFn: async () => {
    const result = await postPostUserList({
      query: { userId: auth.userId, page: page.value, pageSize: pageSize.value },
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated(resp.data)
  },
  enabled: !!auth.userId,
})

const list = computed(() => listQuery.data?.value?.list ?? [])
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value)

const columns = [
  { title: '职位', dataIndex: 'title', key: 'title' },
  { title: '公司', dataIndex: 'companyTitle', key: 'companyTitle' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '投递时间', dataIndex: 'createTime', key: 'createTime' },
]
</script>

<template>
  <div class="bg-white rounded-lg p-6">
    <h2 class="text-lg font-medium mb-4">我的投递</h2>
    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="id"
      :pagination="{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      @change="(pag: any) => { page = pag.current; pageSize = pag.pageSize }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <RecruitmentStatusTag :status="record.status" />
        </template>
      </template>
    </a-table>
  </div>
</template>
