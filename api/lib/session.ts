import { randomUUID } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'

interface SessionData {
  username: string
}

const COOKIE_NAME = 'ff_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getStore(): Map<string, SessionData> {
  const key = '__ffSessionStore'
  const globalStore = globalThis as typeof globalThis & { [key: string]: Map<string, SessionData> | undefined }
  if (!globalStore[key]) globalStore[key] = new Map<string, SessionData>()
  return globalStore[key]
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie
  if (!header) return {}
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey) return acc
    acc[rawKey] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}

function cookieHeader(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function createSession(res: ServerResponse, username: string): string {
  const token = randomUUID()
  getStore().set(token, { username })
  res.setHeader('Set-Cookie', cookieHeader(COOKIE_NAME, token, SESSION_TTL_SECONDS))
  return token
}

export function destroySession(req: IncomingMessage, res: ServerResponse): void {
  const token = parseCookies(req)[COOKIE_NAME]
  if (token) getStore().delete(token)
  res.setHeader('Set-Cookie', cookieHeader(COOKIE_NAME, '', 0))
}

export function getSession(req: IncomingMessage): SessionData | null {
  const token = parseCookies(req)[COOKIE_NAME]
  if (!token) return null
  return getStore().get(token) ?? null
}

export function requireSession(req: IncomingMessage, res: ServerResponse): SessionData | null {
  const session = getSession(req)
  if (session) return session
  res.writeHead(401, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Unauthorized' }))
  return null
}
