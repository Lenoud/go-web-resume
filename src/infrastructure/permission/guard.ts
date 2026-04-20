import { PermissionCode } from './types.js'

/** 角色 → 权限码映射 */
const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  // 管理员(3)：所有权限
  '3': Object.values(PermissionCode),
  // HR(2)：职位/投递/简历/Offer/人才库 操作权限
  '2': [
    PermissionCode.JOB_CREATE, PermissionCode.JOB_UPDATE, PermissionCode.JOB_DELETE,
    PermissionCode.POST_CREATE, PermissionCode.POST_UPDATE, PermissionCode.POST_DELETE,
    PermissionCode.RESUME_CREATE, PermissionCode.RESUME_UPDATE, PermissionCode.RESUME_DELETE,
    PermissionCode.OFFER_CREATE, PermissionCode.OFFER_UPDATE, PermissionCode.OFFER_DELETE,
    PermissionCode.TALENT_ADD, PermissionCode.TALENT_REMOVE, PermissionCode.TALENT_UPDATE,
  ],
  // 求职者(1)：无管理操作权限
  '1': [],
}

/** 检查当前用户是否拥有指定权限 */
export function hasPermission(code: PermissionCode): boolean {
  // 管理员后台路由直接放行（管理员拥有所有权限）
  if (window.location.pathname.startsWith('/admin')) {
    const adminToken = localStorage.getItem('admin_token')
    if (adminToken) return true
  }
  const role = localStorage.getItem('user_role') ?? '1'
  return ROLE_PERMISSIONS[role]?.includes(code) ?? false
}

/** 检查是否拥有任一权限 */
export function hasAnyPermission(...codes: PermissionCode[]): boolean {
  return codes.some(hasPermission)
}
