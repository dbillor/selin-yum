// Minimal self-hosted API using Node core modules only
// Stores data in server/data/db.json
import { createServer } from 'http'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { parse } from 'url'
import { fileURLToPath } from 'url'
import path from 'path'

const DEFAULT_DIR_URL = new URL('./data/', import.meta.url)
const DATA_DIR = process.env.DATA_DIR || fileURLToPath(DEFAULT_DIR_URL)
const DATA_PATH = path.join(DATA_DIR, 'db.json')

// Static file serving (serve built frontend from ../dist)
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(SERVER_DIR, '..', 'dist')
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8'
}

function sendFile(res, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase()
    const body = readFileSync(filePath)
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext && ext !== '.html' ? 'public, max-age=31536000, immutable' : 'no-cache'
    })
    res.end(body)
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
}

function serveStatic(res, pathname) {
  // Normalize path and prevent path traversal
  const safePath = pathname.endsWith('/') ? pathname + 'index.html' : pathname
  const absPath = path.normalize(path.join(DIST_DIR, safePath))
  if (!absPath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
    return res.end('Forbidden')
  }
  // If file exists, serve it; otherwise SPA fallback to index.html
  if (existsSync(absPath)) return sendFile(res, absPath)
  const fallback = path.join(DIST_DIR, 'index.html')
  if (existsSync(fallback)) return sendFile(res, fallback)
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('Not found')
}

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

  // If request is not for /api, serve static frontend
  if (!pathname || !pathname.startsWith('/api')) {
    return serveStatic(res, pathname || '/')
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
