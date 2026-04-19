import type { App, Directive } from 'vue'
import { hasPermission } from './guard'
import type { PermissionCode } from './types'

/**
 * v-permission 指令
 * 用法：v-permission="PermissionCode.USER_DELETE"
 * 无权限时移除 DOM 元素（v-if 语义）
 */
export const vPermission: Directive<HTMLElement, PermissionCode> = {
  mounted(el, binding) {
    if (!hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}

/** 注册到 Vue 实例 */
export function registerPermissionDirective(app: App) {
  app.directive('permission', vPermission)
}
