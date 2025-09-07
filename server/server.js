// Minimal self-hosted API using Node core modules only
// Stores data in server/data/db.json
import { createServer } from 'http'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { parse } from 'url'

const DATA_DIR = new URL('./data/', import.meta.url)
const DATA_PATH = new URL('./data/db.json', import.meta.url)

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(DATA_PATH)) {
    const initial = {
      seq: { feedings: 1, diapers: 1, sleeps: 1, growth: 1, baby: 1 },
      feedings: [],
      diapers: [],
      sleeps: [],
      growth: [],
      baby: []
    }
    writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2))
  }
}

function load() {
  ensureStore()
  const raw = readFileSync(DATA_PATH, 'utf8')
  return JSON.parse(raw)
}

function save(db) {
  writeFileSync(DATA_PATH, JSON.stringify(db, null, 2))
}

function send(res, code, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
    ...headers
  })
  res.end(payload)
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
    })
  })
}

const server = createServer(async (req, res) => {
  const { pathname } = parse(req.url || '', true)

  if (req.method === 'OPTIONS') {
    return send(res, 204, '')
  }

  if (pathname === '/api/health') {
    return send(res, 200, { ok: true })
  }

  if (pathname === '/api/export' && req.method === 'GET') {
    const db = load()
    return send(res, 200, {
      baby: db.baby,
      feedings: db.feedings,
      diapers: db.diapers,
      sleeps: db.sleeps,
      growth: db.growth
    })
  }
  if (pathname === '/api/import' && req.method === 'POST') {
    const incoming = await parseBody(req)
    const db = load()
    if (incoming.baby) db.baby = incoming.baby
    if (incoming.feedings) db.feedings = incoming.feedings
    if (incoming.diapers) db.diapers = incoming.diapers
    if (incoming.sleeps) db.sleeps = incoming.sleeps
    if (incoming.growth) db.growth = incoming.growth
    save(db)
    return send(res, 200, { ok: true })
  }

  // Collections helper
  const collections = ['feedings', 'diapers', 'sleeps', 'growth', 'baby']
  const col = collections.find(c => pathname?.startsWith(`/api/${c}`))
  if (col) {
    const db = load()
    const parts = pathname.split('/') // ['', 'api', col, id?]
    const id = parts.length > 3 ? parseInt(parts[3], 10) : null

    if (req.method === 'GET' && parts.length === 3) {
      return send(res, 200, db[col])
    }
    if (req.method === 'POST' && parts.length === 3) {
      const body = await parseBody(req)
      const nextId = db.seq[col]++
      const row = { id: nextId, ...body }
      db[col].push(row)
      save(db)
      return send(res, 201, row)
    }
    if (req.method === 'DELETE' && parts.length === 4 && id) {
      db[col] = db[col].filter(r => r.id !== id)
      save(db)
      return send(res, 200, { ok: true })
    }
    if (req.method === 'PUT' && parts.length === 4 && id) {
      const body = await parseBody(req)
      const idx = db[col].findIndex(r => r.id === id)
      if (idx === -1) return send(res, 404, { error: 'not found' })
      db[col][idx] = { ...db[col][idx], ...body }
      save(db)
      return send(res, 200, db[col][idx])
    }
  }

  send(res, 404, { error: 'not found' })
})

const port = process.env.PORT || 8787
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`)
})

