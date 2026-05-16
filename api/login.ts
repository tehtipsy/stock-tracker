import type { IncomingMessage, ServerResponse } from 'http'
import { createSession } from './lib/session'

interface LoginPayload {
  username?: string
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))

  let body: LoginPayload
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as LoginPayload
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }

  const username = body.username?.trim().toLowerCase() ?? ''
  if (!username) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'username is required' }))
    return
  }

  createSession(res, username)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ authenticated: true, username }))
}
