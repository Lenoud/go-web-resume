import type { RouteRecordRaw } from 'vue-router'

const frontendRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/index',
  },
  {
    path: '/index',
    name: 'index',
    component: () => import('@/layouts/FrontendLayout.vue'),
    redirect: '/index/home',
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/features/auth/pages/UserLoginPage.vue'),
        meta: { title: '登录' },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/features/auth/pages/UserLoginPage.vue'),
        meta: { title: '注册' },
      },
      {
        path: 'home',
        name: 'home',
        component: () => import('@/features/job/pages/JobListPage.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'experienced',
        name: 'experienced',
        component: () => import('@/features/job/pages/JobListPage.vue'),
        meta: { title: '社会招聘' },
      },
      {
        path: 'campus',
        name: 'campus',
        component: () => import('@/features/job/pages/JobListPage.vue'),
        meta: { title: '校园招聘' },
      },
      {
        path: 'detail',
        name: 'detail',
        component: () => import('@/features/job/pages/JobDetailPage.vue'),
        meta: { title: '职位详情' },
      },
      {
        path: 'usercenter',
        name: 'usercenter',
        component: () => import('@/features/user-center/components/UserCenterLayout.vue'),
        meta: { requiresUserAuth: true, title: '用户中心' },
        children: [
          // HR(2) 专属
          {
            path: 'myJobView',
            name: 'myJobView',
            component: () => import('@/features/job/pages/MyJobPage.vue'),
            meta: { roles: ['2'], title: '岗位管理' },
          },
          {
            path: 'companyPostView',
            name: 'companyPostView',
            component: () => import('@/features/post/pages/CompanyPostPage.vue'),
            meta: { roles: ['2'], title: '投递管理' },
          },
          {
            path: 'resumeManagementView',
            name: 'resumeManagementView',
            component: () => import('@/features/resume-snapshot/pages/SnapshotAdminPage.vue'),
            meta: { roles: ['2'], title: '简历快照管理' },
          },
          {
            path: 'offerView',
            name: 'offerView',
            component: () => import('@/features/offer/pages/OfferAdminPage.vue'),
            meta: { roles: ['2'], title: 'Offer管理' },
          },
          {
            path: 'talentPoolView',
            name: 'talentPoolView',
            component: () => import('@/features/talent-pool/pages/TalentPoolPage.vue'),
            meta: { roles: ['2'], title: '人才库' },
          },
          // 求职者(1) 专属
          {
            path: 'myPostView',
            name: 'myPostView',
            component: () => import('@/features/post/pages/MyPostPage.vue'),
            meta: { roles: ['1'], title: '我的投递' },
          },
          {
            path: 'myInterviewView',
            name: 'myInterviewView',
            component: () => import('@/features/interview/pages/MyInterviewPage.vue'),
            meta: { roles: ['1'], title: '我的面试' },
          },
          {
            path: 'myOfferView',
            name: 'myOfferView',
            component: () => import('@/features/offer/pages/MyOfferPage.vue'),
            meta: { roles: ['1'], title: '我的Offer' },
          },
          {
            path: 'resumeEditView',
            name: 'resumeEditView',
            component: () => import('@/features/resume/pages/ResumeEditPage.vue'),
            meta: { roles: ['1'], title: '我的简历' },
          },
          // 公共
          {
            path: 'userInfoEditView',
            name: 'userInfoEditView',
            component: () => import('@/features/user-center/pages/UserInfoPage.vue'),
            meta: { title: '个人信息' },
          },
          {
            path: 'securityView',
            name: 'securityView',
            component: () => import('@/features/user-center/pages/SecurityPage.vue'),
            meta: { title: '安全设置' },
          },
        ],
      },
    ],
  },
]

export default frontendRoutes
