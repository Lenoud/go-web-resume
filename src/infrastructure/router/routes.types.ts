// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare module 'vue-router' {
  interface RouteMeta {
    /** 是否需要 Admin 认证 */
    requiresAdminAuth?: boolean
    /** 是否需要 User 认证 */
    requiresUserAuth?: boolean
    /** 允许访问的角色（空数组 = 不限制） */
    roles?: string[]
    /** 页面标题 */
    title?: string
    /** 按钮级权限白名单（空 = 不限制） */
    permissions?: string[]
  }
}
