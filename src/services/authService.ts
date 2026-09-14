const AUTH_STORAGE_KEY = 'production_control_auth'

const TEMP_USERNAME = 'admin'
const TEMP_PASSWORD = '123'

interface AuthSession {
  authenticated: true
  username: string
}

function readSession(storage: Storage): AuthSession | null {
  try {
    const value = storage.getItem(AUTH_STORAGE_KEY)
    if (!value) return null

    const session = JSON.parse(value) as Partial<AuthSession>
    return session.authenticated === true && typeof session.username === 'string'
      ? session as AuthSession
      : null
  } catch {
    return null
  }
}

export async function login(
  username: string,
  password: string,
  remember: boolean,
): Promise<boolean> {
  await new Promise((resolve) => window.setTimeout(resolve, 350))

  if (username !== TEMP_USERNAME || password !== TEMP_PASSWORD) {
    return false
  }

  const session: AuthSession = {
    authenticated: true,
    username,
  }

  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))

  return true
}

export function isAuthenticated(): boolean {
  return Boolean(
    readSession(localStorage)
    ?? readSession(sessionStorage),
  )
}

export function getAuthenticatedUsername(): string | null {
  return (
    readSession(localStorage)
    ?? readSession(sessionStorage)
  )?.username ?? null
}

export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
