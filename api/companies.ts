import type { IncomingMessage, ServerResponse } from 'http'
import type { Company } from '../src/types'
import { getCompaniesByUser, saveCompaniesByUser } from './lib/companiesDal'
import { requireSession } from './lib/session'

interface CompaniesPayload {
  companies?: Company[]
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const session = requireSession(req, res)
  if (!session) return

  if (req.method === 'GET') {
    const companies = await getCompaniesByUser(session.username)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ companies }))
    return
  }

  if (req.method === 'PUT') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(Buffer.from(chunk))

    let body: CompaniesPayload
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as CompaniesPayload
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      return
    }

    if (!Array.isArray(body.companies)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'companies array is required' }))
      return
    }

    await saveCompaniesByUser(session.username, body.companies)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(405, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Method not allowed' }))
}
