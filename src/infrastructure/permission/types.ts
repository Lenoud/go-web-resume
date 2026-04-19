/**
 * 权限码设计：模块:操作
 * 角色决定可访问的路由，权限码控制页面内按钮的显示。
 */
export enum PermissionCode {
  // 用户模块
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // 公司模块
  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',

  // 部门模块
  DEPT_CREATE = 'dept:create',
  DEPT_UPDATE = 'dept:update',
  DEPT_DELETE = 'dept:delete',

  // 职位模块
  JOB_CREATE = 'job:create',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',

  // 简历模块
  RESUME_CREATE = 'resume:create',
  RESUME_UPDATE = 'resume:update',
  RESUME_DELETE = 'resume:delete',

  // 投递模块
  POST_CREATE = 'post:create',
  POST_UPDATE = 'post:update',
  POST_DELETE = 'post:delete',

  // Offer 模块
  OFFER_CREATE = 'offer:create',
  OFFER_UPDATE = 'offer:update',
  OFFER_DELETE = 'offer:delete',

  // 人才库
  TALENT_ADD = 'talent:add',
  TALENT_REMOVE = 'talent:remove',
  TALENT_UPDATE = 'talent:update',
}
