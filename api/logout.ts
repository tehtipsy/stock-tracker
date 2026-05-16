import type { IncomingMessage, ServerResponse } from 'http'
import { destroySession } from './lib/session'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  destroySession(req, res)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ authenticated: false }))
}
