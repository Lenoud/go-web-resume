<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_LABEL, STATUS_COLOR, type RecruitmentStatus } from '@/shared/types'

const props = defineProps<{ status?: string }>()

const label = computed(() => {
  if (!props.status) return '-'
  return STATUS_LABEL[props.status as RecruitmentStatus] ?? props.status
})

const color = computed(() => {
  if (!props.status) return 'default'
  return STATUS_COLOR[props.status as RecruitmentStatus] ?? 'default'
})
</script>

<template>
  <a-tag :color="color">{{ label }}</a-tag>
</template>
