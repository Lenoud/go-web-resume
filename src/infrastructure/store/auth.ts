import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ADMIN_TOKEN_KEY, ADMIN_USER_ID_KEY, ADMIN_USERNAME_KEY,
  USER_TOKEN_KEY, USER_ID_KEY, USERNAME_KEY, USER_ROLE_KEY,
} from '@/shared/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  // ── Admin 状态 ──
  const adminToken = ref(localStorage.getItem(ADMIN_TOKEN_KEY) ?? '')
  const adminUserId = ref(localStorage.getItem(ADMIN_USER_ID_KEY) ?? '')
  const adminUsername = ref(localStorage.getItem(ADMIN_USERNAME_KEY) ?? '')

  // ── User 状态 ──
  const userToken = ref(localStorage.getItem(USER_TOKEN_KEY) ?? '')
  const userId = ref(localStorage.getItem(USER_ID_KEY) ?? '')
  const username = ref(localStorage.getItem(USERNAME_KEY) ?? '')
  const userRole = ref(localStorage.getItem(USER_ROLE_KEY) ?? '1')

  // ── Getters ──
  const isAdminLoggedIn = computed(() => !!adminToken.value)
  const isUserLoggedIn = computed(() => !!userToken.value)
  const currentUserRole = computed(() => userRole.value)

  // ── Actions ──
  function setAdminAuth(data: { token: string; userId: string; username: string }) {
    adminToken.value = data.token
    adminUserId.value = data.userId
    adminUsername.value = data.username
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
    localStorage.setItem(ADMIN_USER_ID_KEY, data.userId)
    localStorage.setItem(ADMIN_USERNAME_KEY, data.username)
  }

  function setUserAuth(data: { token: string; userId: string; username: string; role: string }) {
    userToken.value = data.token
    userId.value = data.userId
    username.value = data.username
    userRole.value = data.role
    localStorage.setItem(USER_TOKEN_KEY, data.token)
    localStorage.setItem(USER_ID_KEY, data.userId)
    localStorage.setItem(USERNAME_KEY, data.username)
    localStorage.setItem(USER_ROLE_KEY, data.role)
  }

  function logout(isAdmin: boolean) {
    if (isAdmin) {
      adminToken.value = ''
      adminUserId.value = ''
      adminUsername.value = ''
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_USER_ID_KEY)
      localStorage.removeItem(ADMIN_USERNAME_KEY)
    } else {
      userToken.value = ''
      userId.value = ''
      username.value = ''
      userRole.value = '1'
      localStorage.removeItem(USER_TOKEN_KEY)
      localStorage.removeItem(USER_ID_KEY)
      localStorage.removeItem(USERNAME_KEY)
      localStorage.removeItem(USER_ROLE_KEY)
    }
  }

  return {
    adminToken, adminUserId, adminUsername,
    userToken, userId, username, userRole,
    isAdminLoggedIn, isUserLoggedIn, currentUserRole,
    setAdminAuth, setUserAuth, logout,
  }
})
