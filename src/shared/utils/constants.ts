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

// ── 固定下拉选项 ──

/** 学历选项 */
export const EDUCATION_OPTIONS = [
  { label: '不限', value: '不限' },
  { label: '高中', value: '高中' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
  { label: '博士', value: '博士' },
]

/** 性别选项 */
export const SEX_OPTIONS = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
]

/** 简历来源选项（管理后台） */
export const RESUME_SOURCE_OPTIONS = [
  { label: '自投', value: '自投' },
  { label: '内推', value: '内推' },
  { label: '猎头', value: '猎头' },
  { label: '校招', value: '校招' },
  { label: '社招', value: '社招' },
  { label: '招聘会', value: '招聘会' },
  { label: 'Boss直聘', value: 'Boss直聘' },
  { label: '拉勾', value: '拉勾' },
  { label: '智联招聘', value: '智联招聘' },
  { label: '前程无忧', value: '前程无忧' },
  { label: '社交媒体', value: '社交媒体' },
  { label: '其他', value: '其他' },
]

/** 招聘类型选项 */
export const RECRUIT_TYPE_OPTIONS = [
  { label: '社招', value: 'experienced' },
  { label: '校招', value: 'campus' },
]

/** 工作性质选项（根据招聘类型联动） */
export const JOB_NATURE_MAP: Record<string, { label: string; value: string }[]> = {
  experienced: [
    { label: '全职', value: 'fulltime' },
    { label: '兼职', value: 'parttime' },
  ],
  campus: [
    { label: '实习', value: 'intern' },
    { label: '全职', value: 'fulltime' },
  ],
  all: [
    { label: '全职', value: 'fulltime' },
    { label: '兼职', value: 'parttime' },
    { label: '实习', value: 'intern' },
  ],
}

/** 工作经验选项 */
export const WORK_EXPERIENCE_OPTIONS = [
  { label: '不限', value: '不限' },
  { label: '应届毕业生', value: '应届毕业生' },
  { label: '1-3年', value: '1-3年' },
  { label: '3-5年', value: '3-5年' },
  { label: '5-10年', value: '5-10年' },
  { label: '10年以上', value: '10年以上' },
]

/** 职位分类选项 */
export const JOB_CATEGORY_OPTIONS = [
  { label: '技术', value: '技术' },
  { label: '产品', value: '产品' },
  { label: '设计', value: '设计' },
  { label: '运营', value: '运营' },
  { label: '市场', value: '市场' },
  { label: '销售', value: '销售' },
  { label: '人事', value: '人事' },
  { label: '行政', value: '行政' },
  { label: '财务', value: '财务' },
  { label: '其他', value: '其他' },
]
