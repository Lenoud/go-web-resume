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

/** Offer 职级选项 */
export const OFFER_LEVEL_OPTIONS = [
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
  { label: 'P4', value: 'P4' },
  { label: 'P5', value: 'P5' },
  { label: 'P6', value: 'P6' },
  { label: 'P7', value: 'P7' },
  { label: 'P8', value: 'P8' },
  { label: '初级', value: '初级' },
  { label: '中级', value: '中级' },
  { label: '高级', value: '高级' },
  { label: '资深', value: '资深' },
  { label: '专家', value: '专家' },
]

/** Offer 试用期选项 */
export const OFFER_PROBATION_OPTIONS = [
  { label: '无试用期', value: '无' },
  { label: '1个月', value: '1个月' },
  { label: '2个月', value: '2个月' },
  { label: '3个月', value: '3个月' },
  { label: '6个月', value: '6个月' },
]

/** Offer 合同期限选项 */
export const OFFER_CONTRACT_OPTIONS = [
  { label: '1年', value: '1年' },
  { label: '2年', value: '2年' },
  { label: '3年', value: '3年' },
  { label: '5年', value: '5年' },
  { label: '无固定期限', value: '无固定期限' },
]
