// localStorage key 常量

// Admin 端
export const ADMIN_TOKEN_KEY = 'admin_token'
export const ADMIN_USER_ID_KEY = 'admin_user_id'
export const ADMIN_USERNAME_KEY = 'admin_username'

// 前台 User 端
export const USER_TOKEN_KEY = 'user_token'
export const USER_ID_KEY = 'user_id'
export const USERNAME_KEY = 'username'
export const USER_ROLE_KEY = 'user_role'

// 角色枚举
export const ROLE = {
  JOB_SEEKER: '1', // 求职者
  HR: '2',         // HR
  ADMIN: '3',      // 管理员
} as const

export type RoleValue = (typeof ROLE)[keyof typeof ROLE]
