import { createHmac } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'

interface SessionData {
  username: string
}

const COOKIE_NAME = 'ff_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production')
}
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'stock-tracker-dev-secret'

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

function signUsername(username: string): string {
  return createHmac('sha256', SESSION_SECRET).update(username).digest('hex')
}

export function createSession(res: ServerResponse, username: string): string {
  const token = `${username}.${signUsername(username)}`
  res.setHeader('Set-Cookie', cookieHeader(COOKIE_NAME, token, SESSION_TTL_SECONDS))
  return token
}

export function destroySession(_req: IncomingMessage, res: ServerResponse): void {
  res.setHeader('Set-Cookie', cookieHeader(COOKIE_NAME, '', 0))
}

export function getSession(req: IncomingMessage): SessionData | null {
  const token = parseCookies(req)[COOKIE_NAME]
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [username, signature] = parts
  if (!username || !signature) return null
  if (signUsername(username) !== signature) return null
  return { username }
}

export function requireSession(req: IncomingMessage, res: ServerResponse): SessionData | null {
  const session = getSession(req)
  if (session) return session
  res.writeHead(401, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Unauthorized' }))
  return null
}
