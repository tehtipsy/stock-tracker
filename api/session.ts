import type { IncomingMessage, ServerResponse } from 'http'
import { getSession } from './lib/session'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const session = getSession(req)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    authenticated: !!session,
    username: session?.username ?? null,
  }))
}
