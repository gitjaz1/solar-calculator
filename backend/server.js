const path = require('path')
const envFile = process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env'
require('dotenv').config({ path: path.resolve(__dirname, envFile), override: false })

require('./services/validateEnv')()

const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')

const logger     = require('./services/logger')
const db         = require('./services/db')
const { metricsMiddleware, metricsHandler } = require('./services/metrics')
const { calcClient } = require('./services/calcClient')
const { registerShutdown } = require('./services/shutdown')

const { generalLimiter } = require('./middleware/rateLimit')

const authRoutes      = require('./routes/auth')
const calculateRoutes = require('./routes/calculate')
const offerRoutes     = require('./routes/offer')
const adminRoutes     = require('./routes/admin')

const app    = express()
app.set('trust proxy', 1) // Fix 1: trust proxy
const PORT   = process.env.PORT ?? 4000
const isProd = process.env.NODE_ENV === 'production'

// ── Security headers ───────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  crossOriginEmbedderPolicy: false,
}))

// ── CORS ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (!isProd || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
}))

// ── Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false, limit: '2mb' }))


// ── Logging + metrics ──────────────────────────────────────────────────
app.use(logger.httpMiddleware())
app.use(metricsMiddleware)

// ── Rate limiting ──────────────────────────────────────────────────────
app.use(generalLimiter)

// ── Input sanitisation ─────────────────────────────────────────────────
app.use((req, _res, next) => {
  function clean(obj) {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    }
    if (Array.isArray(obj)) return obj.map(clean)
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, clean(v)]))
    }
    return obj
  }
  req.query  = clean(req.query)
  req.params = clean(req.params)
  next()
})

// ── Routes ─────────────────────────────────────────────────────────────
app.use('/auth',      authRoutes)
app.use('/calculate', calculateRoutes)
app.use('/offer',     offerRoutes)
app.use('/admin',     adminRoutes)

// ── Metrics ────────────────────────────────────────────────────────────
app.get('/metrics', metricsHandler)

// ── Health ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  ts:     new Date(),
  env:    process.env.NODE_ENV,
  calc:   calcClient.circuitBreakerStatus(),
}))

// ── Readiness ──────────────────────────────────────────────────────────
app.get('/ready', async (_req, res) => {
  const checks = {}
  let allOk    = true

  try {
    await db.pool.query('SELECT 1')
    checks.postgres = { ok: true }
  } catch (err) {
    checks.postgres = { ok: false, error: err.message }
    allOk = false
  }

  // Fix 2: use ioredis instead of raw TCP socket
  try {
    const IORedis = require('ioredis')
    const redisClient = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout:       3000,
      lazyConnect:          true,
    })
    await redisClient.connect()
    await redisClient.ping()
    await redisClient.quit()
    checks.redis = { ok: true }
  } catch (err) {
    checks.redis = { ok: false, error: err.message }
    allOk = false
  }

  try {
    const resp = await calcClient.get('/health', { timeout: 5000 })
    checks.calcEngine = { ok: true, status: resp.data?.status }
  } catch (err) {
    checks.calcEngine = { ok: false, error: err.message }
    allOk = false
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    ts:     new Date(),
    checks,
  })
})

// ── 404 ────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Not found' }))

// ── Global error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const status  = err.status ?? err.statusCode ?? 500
  const message = isProd && status === 500
    ? 'Internal server error'
    : (err.message ?? 'Internal error')
  if (status >= 500) logger.error('server_error', { error: err.message, stack: err.stack })
  res.status(status).json({ message })
})

// ── Start ──────────────────────────────────────────────────────────────
if (require.main === module) {
  const httpServer = app.listen(PORT, () =>
    logger.info('server_started', { port: PORT, env: process.env.NODE_ENV })
  )
  registerShutdown(httpServer)
}

module.exports = app