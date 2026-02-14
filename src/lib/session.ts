const COOKIE_NAME = 'parcel_api_key'

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookie) => {
      const separatorIndex = cookie.indexOf('=')
      if (separatorIndex < 0) return acc
      const key = cookie.slice(0, separatorIndex)
      const value = cookie.slice(separatorIndex + 1)
      acc[key] = value
      return acc
    }, {})
}

export function getParcelApiKey(request: Request): string | null {
  const cookies = parseCookies(request.headers.get('cookie'))
  const raw = cookies[COOKIE_NAME]
  if (!raw) return null

  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}

export function sessionCookie(apiKey: string, secure: boolean): string {
  const secureFlag = secure ? '; Secure' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(apiKey)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secureFlag}`
}

export function clearSessionCookie(secure: boolean): string {
  const secureFlag = secure ? '; Secure' : ''
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
}
