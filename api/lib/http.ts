import type { IncomingMessage, ServerResponse } from 'http'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  res.writeHead(status, { ...JSON_HEADERS, ...headers })
  res.end(JSON.stringify(body))
}

export function rejectNonGet(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === 'GET') return false
  sendJson(res, 405, { error: 'Method not allowed' })
  return true
}
