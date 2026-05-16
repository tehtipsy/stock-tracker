import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import type { Company } from '../../src/types'

interface CompanyStore {
  [username: string]: Company[]
}

const DATA_DIR = '/tmp/stock-tracker'
const DATA_FILE = path.join(DATA_DIR, 'companies.json')

async function readStore(): Promise<CompanyStore> {
  try {
    const content = await readFile(DATA_FILE, 'utf8')
    return JSON.parse(content) as CompanyStore
  } catch {
    return {}
  }
}

async function writeStore(store: CompanyStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(store), 'utf8')
}

export async function getCompaniesByUser(username: string): Promise<Company[]> {
  const store = await readStore()
  return store[username] ?? []
}

export async function saveCompaniesByUser(username: string, companies: Company[]): Promise<void> {
  const store = await readStore()
  store[username] = companies
  await writeStore(store)
}
