const db = require('./db')

const counters   = {}
const histograms = {}
const gauges     = {}

const DURATION_BUCKETS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000]

function metricKey(name, labels = {}) {
  const lStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')
  return lStr ? `${name}{${lStr}}` : name
}

function incCounter(name, labels = {}) {
  const key = metricKey(name, labels)
  counters[key] = (counters[key] ?? 0) + 1
}

function observeHistogram(name, value, labels = {}) {
  const key = metricKey(name, labels)
  if (!histograms[key]) {
    const buckets = {}
    for (const b of DURATION_BUCKETS) buckets[b] = 0
    histograms[key] = { name, labels, sum: 0, count: 0, buckets }
  }
  const h = histograms[key]
  h.sum   += value
  h.count += 1
  for (const b of DURATION_BUCKETS) {
    if (value <= b) h.buckets[b]++
  }
}

function setGauge(name, value, labels = {}) {
  const key = metricKey(name, labels)
  gauges[key] = { value, name, labels }
}

function getStats() {
  return { counters, histograms, gauges }
}

const metricsMiddleware = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration    = Date.now() - start
    const route       = req.route?.path ?? req.path
    const method      = req.method
    const status_class = `${Math.floor(res.statusCode / 100)}xx`

    incCounter('http_requests_total', { route, method, status_class })
    observeHistogram('http_request_duration_ms', duration, { route, method })

    db.query(
      `INSERT INTO http_metrics (route, method, status_class, count)
       VALUES ($1, $2, $3, 1)`,
      [route, method, status_class]
    ).catch(() => {})
  })
  next()
}

function recordJob(status, durationMs) {
  incCounter('job_queue_total', { status })
  if (durationMs != null) {
    observeHistogram('job_duration_ms', durationMs)
  }
}

function metricsHandler(req, res) {
  const lines = []

  for (const [key, value] of Object.entries(counters)) {
    lines.push(`# TYPE ${key.split('{')[0]} counter`)
    lines.push(`${key} ${value}`)
  }

  for (const [key, h] of Object.entries(histograms)) {
    const base = key.split('{')[0]
    lines.push(`# TYPE ${base} histogram`)
    for (const [b, count] of Object.entries(h.buckets)) {
      lines.push(`${base}_bucket{le="${b}"} ${count}`)
    }
    lines.push(`${base}_sum ${h.sum}`)
    lines.push(`${base}_count ${h.count}`)
  }

  for (const [key, g] of Object.entries(gauges)) {
    lines.push(`# TYPE ${key.split('{')[0]} gauge`)
    lines.push(`${key} ${g.value}`)
  }

  res.set('Content-Type', 'text/plain; version=0.0.4')
  res.send(lines.join('\n') + '\n')
}

module.exports = {
  incCounter,
  observeHistogram,
  setGauge,
  getStats,
  metricsMiddleware,
  metricsHandler,
  recordJob,
}