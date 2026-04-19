/**
 * 招聘流程 13 状态定义
 * 与后端 api/internal/common/recruitment_status.go 保持一致
 */

/** 11 步主流程 */
export const MAIN_FLOW = [
  'applied',
  'initial_screen',
  're_screen',
  'interview_1',
  'interview_2',
  'interview_3',
  'interview_final',
  'salary_negotiation',
  'offer_sent',
  'offer_accepted',
  'hired',
] as const

/** 2 个分支状态 */
export const BRANCH_STATUSES = ['rejected', 'on_hold'] as const

/** 全部 13 个状态 */
export const ALL_STATUSES = [...MAIN_FLOW, ...BRANCH_STATUSES] as const

export type RecruitmentStatus = (typeof ALL_STATUSES)[number]

/** 状态 → 中文标签 */
export const STATUS_LABEL: Record<RecruitmentStatus, string> = {
  applied: '已投递',
  initial_screen: '初筛',
  re_screen: '复筛',
  interview_1: '一轮面试',
  interview_2: '二轮面试',
  interview_3: '三轮面试',
  interview_final: '终面',
  salary_negotiation: '薪资谈判',
  offer_sent: '已发Offer',
  offer_accepted: '已接受Offer',
  hired: '已入职',
  rejected: '已淘汰',
  on_hold: '挂起',
}

/** 状态 → AntDV Tag 颜色 */
export const STATUS_COLOR: Record<RecruitmentStatus, string> = {
  applied: 'default',
  initial_screen: 'processing',
  re_screen: 'processing',
  interview_1: 'blue',
  interview_2: 'blue',
  interview_3: 'blue',
  interview_final: 'geekblue',
  salary_negotiation: 'orange',
  offer_sent: 'cyan',
  offer_accepted: 'green',
  hired: 'success',
  rejected: 'error',
  on_hold: 'warning',
}
