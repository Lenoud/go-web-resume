<script setup lang="ts">
import { computed } from 'vue'
import { MAIN_FLOW, STATUS_LABEL, STATUS_COLOR, BRANCH_STATUSES, type RecruitmentStatus } from '@/shared/types'

const props = defineProps<{ status?: string }>()

const stages = MAIN_FLOW.map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
  color: colorToHex(STATUS_COLOR[s]),
}))

const currentIdx = computed(() => MAIN_FLOW.indexOf(props.status as RecruitmentStatus))
const isBranch = computed(() => (BRANCH_STATUSES as readonly string[]).includes(props.status ?? ''))
const branchMeta = computed(() => {
  if (!isBranch.value) return null
  const s = props.status as RecruitmentStatus
  return { label: STATUS_LABEL[s], color: colorToHex(STATUS_COLOR[s]) }
})

function dotStyle(idx: number): Record<string, string> {
  const ci = currentIdx.value
  if (isBranch.value) {
    return idx <= ci ? { background: stages[idx].color } : { background: '#d0d5dd' }
  }
  if (idx <= ci) return { background: stages[idx].color }
  return { background: '#d0d5dd' }
}

function lineDone(idx: number): boolean {
  const ci = currentIdx.value
  if (isBranch.value) return idx < ci
  return idx < ci
}

function colorToHex(color: string): string {
  const map: Record<string, string> = {
    default: '#8c8c8c', processing: '#1890ff', cyan: '#13c2c2', gold: '#faad14',
    orange: '#fa8c16', blue: '#1890ff', green: '#52c41a', success: '#52c41a',
    geekblue: '#2f54eb', error: '#ff4d4f', warning: '#faad14',
  }
  return map[color] ?? '#8c8c8c'
}
</script>

<template>
  <div class="pipeline">
    <template v-for="(stage, idx) in stages" :key="stage.value">
      <div
        class="pipe-step"
        :class="{ done: currentIdx > idx, current: !isBranch && currentIdx === idx }"
      >
        <div class="pipe-dot" :style="dotStyle(idx)" />
        <span class="pipe-label">{{ stage.label }}</span>
      </div>
      <div v-if="idx < stages.length - 1" class="pipe-line" :class="{ done: lineDone(idx) }" />
    </template>
    <!-- Branch status (rejected / on_hold) -->
    <template v-if="isBranch && branchMeta">
      <div class="pipe-line" />
      <div class="pipe-step current reject">
        <div class="pipe-dot" :style="{ background: branchMeta.color }" />
        <span class="pipe-label">{{ branchMeta.label }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pipeline {
  display: flex;
  align-items: center;
  gap: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
  overflow-x: auto;
}

.pipe-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pipe-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d0d5dd;
}

.pipe-step.current .pipe-dot {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 0 3px rgba(70, 132, 226, 0.2);
}

.pipe-label {
  font-size: 11px;
  color: #b0b7c3;
  white-space: nowrap;
}

.pipe-step.done .pipe-label {
  color: var(--color-text-secondary);
}

.pipe-step.current .pipe-label {
  color: var(--color-text-primary);
  font-weight: 500;
}

.pipe-step.reject .pipe-label {
  color: #ff4d4f;
  font-weight: 500;
}

.pipe-line {
  flex: 1;
  min-width: 12px;
  height: 2px;
  background: #e8ecf0;
  margin: 0 2px;
  margin-bottom: 18px;
}

.pipe-line.done {
  background: var(--color-primary);
}
</style>
