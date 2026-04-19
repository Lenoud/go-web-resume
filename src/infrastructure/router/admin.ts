import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/login',
    name: 'adminLogin',
    component: () => import('@/features/auth/pages/AdminLoginPage.vue'),
    meta: { title: '管理员登录' },
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdminAuth: true, title: '管理后台' },
    redirect: '/admin/job',
    children: [
      {
        path: 'job',
        name: 'adminJob',
        component: () => import('@/features/job/pages/JobAdminPage.vue'),
        meta: { title: '职位管理' },
      },
      {
        path: 'resume',
        name: 'adminResume',
        component: () => import('@/features/resume/pages/ResumeAdminPage.vue'),
        meta: { title: '简历管理' },
      },
      {
        path: 'resumeSnapshot',
        name: 'adminResumeSnapshot',
        component: () => import('@/features/resume-snapshot/pages/SnapshotAdminPage.vue'),
        meta: { title: '简历快照' },
      },
      {
        path: 'talentPool',
        name: 'adminTalentPool',
        component: () => import('@/features/talent-pool/pages/TalentPoolPage.vue'),
        meta: { title: '人才库' },
      },
      {
        path: 'company',
        name: 'adminCompany',
        component: () => import('@/features/company/pages/CompanyAdminPage.vue'),
        meta: { title: '公司管理' },
      },
      {
        path: 'user',
        name: 'adminUser',
        component: () => import('@/features/user/pages/UserAdminPage.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'department',
        name: 'adminDepartment',
        component: () => import('@/features/department/pages/DepartmentAdminPage.vue'),
        meta: { title: '部门管理' },
      },
      {
        path: 'offer',
        name: 'adminOffer',
        component: () => import('@/features/offer/pages/OfferAdminPage.vue'),
        meta: { title: 'Offer管理' },
      },
      {
        path: 'opLog',
        name: 'adminOpLog',
        component: () => import('@/features/oplog/pages/OpLogAdminPage.vue'),
        meta: { title: '操作日志' },
      },
    ],
  },
]

export default adminRoutes
