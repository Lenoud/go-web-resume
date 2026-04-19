/**
 * JWT Token 解码工具
 * 仅解析 payload，不做签名验证（前端无需验证签名）
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * 检查 JWT 是否过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  return Date.now() >= (payload.exp as number) * 1000
}
