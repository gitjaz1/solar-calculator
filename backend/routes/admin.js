const router = require('express').Router()
const fs     = require('fs')
const path   = require('path')
const db     = require('../services/db')
const logger = require('../services/logger')
const { requireAdmin }   = require('../middleware/auth')
const { calcClient }     = require('../services/calcClient')

const OVERRIDES_PATH = process.env.PRICING_OVERRIDES_PATH
  ?? path.join(__dirname, '../../config/pricing_overrides.json')

const DEFAULT_PRICES = {
  '200101': 185,
  '200201': 12.5,
  '200301': 12.5,
  '100701': 3.2,
  '100801': 3.2,
  '100901': 3.2,
  '100601': 8.9,
}

const DEFAULT_TIERS = [
  { min_qty: 500, discount_pct: 15 },
  { min_qty: 200, discount_pct: 10 },
  { min_qty: 100, discount_pct: 5  },
  { min_qty: 0,   discount_pct: 0  },
]

function loadPricing() {
  let unit_prices    = { ...DEFAULT_PRICES }
  let discount_tiers = [...DEFAULT_TIERS]

  if (fs.existsSync(OVERRIDES_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
      if (data.unit_prices)    unit_prices    = { ...unit_prices, ...data.unit_prices }
      if (data.discount_tiers) discount_tiers = data.discount_tiers
    } catch (err) {
      logger.warn('pricing_read_failed', { error: err.message })
    }
  }

  return { unit_prices, discount_tiers }
}

// ── GET /admin/pricing ────────────────────────────────────────────────
router.get('/pricing', requireAdmin, (req, res) => {
  res.json(loadPricing())
})

// ── POST /admin/pricing ───────────────────────────────────────────────
router.post('/pricing', requireAdmin, async (req, res, next) => {
  try {
    const { unit_prices, discount_tiers } = req.body

    if (typeof unit_prices !== 'object' || !Array.isArray(discount_tiers)) {
      return res.status(400).json({ message: 'Invalid payload' })
    }

    for (const [art, price] of Object.entries(unit_prices)) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: `Invalid price for article ${art}` })
      }
    }

    for (const tier of discount_tiers) {
      if (
        typeof tier.min_qty      !== 'number' ||
        typeof tier.discount_pct !== 'number'
      ) {
        return res.status(400).json({
          message: 'Each tier must have numeric min_qty and discount_pct',
        })
      }
    }

    const dir = path.dirname(OVERRIDES_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    await fs.promises.writeFile(
      OVERRIDES_PATH,
      JSON.stringify({ unit_prices, discount_tiers }, null, 2),
      'utf8'
    )

    logger.info('pricing_saved', { ip: req.ip })

    try {
      await calcClient.post('/reload-config', {}, {
        timeout: 5000,
        headers: { 'X-Admin-Secret': process.env.ADMIN_SECRET },
      })
      logger.info('calc_engine_reload_triggered')
    } catch (reloadErr) {
      logger.warn('calc_engine_reload_failed', { error: reloadErr.message })
    }

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ── GET /admin/analytics ──────────────────────────────────────────────
router.get('/analytics', requireAdmin, async (req, res, next) => {
  try {
    const safe = (p) => p.catch(() => ({ rows: [{ c: 0 }] }))

    const [
      totalUsers, newUsers7d, newUsers30d,
      totalProjects, newProjects7d,
      projectsByCountry,
      jobStats, recentJobs,
      httpMetrics, offersTotal,
      activity,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS c FROM users`),
      db.query(`SELECT COUNT(*) AS c FROM users WHERE created_at > NOW() - INTERVAL '7 days'`),
      db.query(`SELECT COUNT(*) AS c FROM users WHERE created_at > NOW() - INTERVAL '30 days'`),
      db.query(`SELECT COUNT(*) AS c FROM projects`),
      db.query(`SELECT COUNT(*) AS c FROM projects WHERE created_at > NOW() - INTERVAL '7 days'`),
      db.query(`SELECT country, COUNT(*) AS c FROM projects GROUP BY country ORDER BY c DESC LIMIT 10`),
      safe(db.query(
        `SELECT status, COUNT(*) AS total,
                ROUND(AVG(duration_ms))   AS avg_ms,
                ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)) AS p95_ms
         FROM jobs GROUP BY status`
      )),
      safe(db.query(
        `SELECT id, status, offer_ref, user_email, queued_at, duration_ms, error_message
         FROM jobs ORDER BY queued_at DESC LIMIT 20`
      )),
      safe(db.query(
        `SELECT route, method, status_class, SUM(count) AS total
         FROM http_metrics
         WHERE bucket_ts > NOW() - INTERVAL '24 hours'
         GROUP BY route, method, status_class
         ORDER BY total DESC LIMIT 20`
      )),
      safe(db.query(`SELECT COUNT(*) AS c FROM offers`)),
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS c
         FROM projects
         WHERE created_at > NOW() - INTERVAL '14 days'
         GROUP BY day ORDER BY day ASC`
      ),
    ])

    res.json({
      users: {
        total:  +totalUsers.rows[0].c,
        last7d: +newUsers7d.rows[0].c,
        last30d: +newUsers30d.rows[0].c,
      },
      projects: {
        total:     +totalProjects.rows[0].c,
        last7d:    +newProjects7d.rows[0].c,
        byCountry: projectsByCountry.rows.map(r => ({
          country: r.country,
          count:   +r.c,
        })),
      },
      offers:   { total: +offersTotal.rows[0].c },
      jobs:     { stats: jobStats.rows, recent: recentJobs.rows },
      http:     { routes: httpMetrics.rows },
      activity: activity.rows.map(r => ({ day: r.day, count: +r.c })),
    })
  } catch (err) { next(err) }
})

module.exports = router