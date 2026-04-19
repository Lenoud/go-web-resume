/**
 * 集中管理所有 QueryKey，避免散落在各处导致冲突。
 * 层级结构：[模块, 操作, 参数]
 */
export const queryKeys = {
  // 用户
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  // 职位
  jobs: {
    all: ['jobs'] as const,
    list: (params?: Record<string, unknown>) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    categories: ['jobs', 'categories'] as const,
    userJobs: (params?: Record<string, unknown>) => ['jobs', 'user', params] as const,
  },
  // 公司
  companies: {
    all: ['companies'] as const,
    list: (params?: Record<string, unknown>) => ['companies', 'list', params] as const,
  },
  // 部门
  departments: {
    all: ['departments'] as const,
    list: (params?: Record<string, unknown>) => ['departments', 'list', params] as const,
  },
  // 简历
  resumes: {
    all: ['resumes'] as const,
    list: (params?: Record<string, unknown>) => ['resumes', 'list', params] as const,
    detail: (userId: string) => ['resumes', 'detail', userId] as const,
  },
  // 投递
  posts: {
    all: ['posts'] as const,
    list: (params?: Record<string, unknown>) => ['posts', 'list', params] as const,
    userPosts: (userId: string, params?: Record<string, unknown>) => ['posts', 'user', userId, params] as const,
    companyPosts: (companyId: string, params?: Record<string, unknown>) => ['posts', 'company', companyId, params] as const,
    statusLogs: (targetType: string, targetId: string) => ['posts', 'statusLogs', targetType, targetId] as const,
  },
  // 简历快照
  resumeSnapshots: {
    all: ['resumeSnapshots'] as const,
    list: (params?: Record<string, unknown>) => ['resumeSnapshots', 'list', params] as const,
    detail: (id: string) => ['resumeSnapshots', 'detail', id] as const,
  },
  // 人才库
  talentPool: {
    all: ['talentPool'] as const,
    list: (params?: Record<string, unknown>) => ['talentPool', 'list', params] as const,
  },
  // 面试
  interviews: {
    all: ['interviews'] as const,
    list: (postId: string) => ['interviews', postId] as const,
  },
  // Offer
  offers: {
    all: ['offers'] as const,
    list: (params?: Record<string, unknown>) => ['offers', 'list', params] as const,
    detail: (postId: string) => ['offers', 'detail', postId] as const,
  },
  // 操作日志
  opLogs: {
    all: ['opLogs'] as const,
    list: (params?: Record<string, unknown>) => ['opLogs', 'list', params] as const,
    loginLogs: (params?: Record<string, unknown>) => ['opLogs', 'loginLogs', params] as const,
  },
} as const
