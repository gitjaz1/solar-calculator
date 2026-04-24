const axios = require('axios')
const logger = require('./logger')

const CALC_URL             = process.env.CALC_ENGINE_URL ?? 'http://localhost:5000'
const CB_FAILURE_THRESHOLD = parseInt(process.env.CB_FAILURE_THRESHOLD ?? '5',     10)
const CB_SUCCESS_THRESHOLD = parseInt(process.env.CB_SUCCESS_THRESHOLD  ?? '2',     10)
const CB_COOLDOWN_MS       = parseInt(process.env.CB_COOLDOWN_MS        ?? '30000', 10)
const RETRY_LIMIT          = parseInt(process.env.CALC_RETRY_LIMIT      ?? '2',     10)
const RETRY_BASE_DELAY_MS  = parseInt(process.env.CALC_RETRY_DELAY_MS   ?? '500',   10)

const CB_STATE = {
  CLOSED:    'CLOSED',
  OPEN:      'OPEN',
  HALF_OPEN: 'HALF_OPEN',
}

const cb = {
  state:         CB_STATE.CLOSED,
  failures:      0,
  successes:     0,
  lastFailureAt: 0,
}

function cbAllow() {
  if (cb.state === CB_STATE.CLOSED) return true
  if (cb.state === CB_STATE.OPEN) {
    const elapsed = Date.now() - cb.lastFailureAt
    if (elapsed >= CB_COOLDOWN_MS) {
      cb.state    = CB_STATE.HALF_OPEN
      cb.successes = 0
      logger.info('circuit_breaker_half_open', { elapsed_ms: elapsed })
      return true
    }
    return false
  }
  return true
}

function cbSuccess() {
  if (cb.state === CB_STATE.HALF_OPEN) {
    cb.successes++
    if (cb.successes >= CB_SUCCESS_THRESHOLD) {
      cb.state    = CB_STATE.CLOSED
      cb.failures = 0
      logger.info('circuit_breaker_closed')
    }
  } else {
    cb.failures = 0
  }
}

function cbFailure(err) {
  cb.failures++
  cb.lastFailureAt = Date.now()
  if (cb.state === CB_STATE.HALF_OPEN || cb.failures >= CB_FAILURE_THRESHOLD) {
    cb.state = CB_STATE.OPEN
    logger.warn('circuit_breaker_open', {
      failures:  cb.failures,
      threshold: CB_FAILURE_THRESHOLD,
      error:     err?.message,
    })
  }
}

function isRetryable(err) {
  if (!err.response) return true
  const s = err.response.status
  return s === 429 || s === 502 || s === 503 || s === 504
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function request(method, path, data, opts = {}) {
  const url = `${CALC_URL}${path}`

  for (let attempt = 1; attempt <= RETRY_LIMIT + 1; attempt++) {
    if (!cbAllow()) {
      const err = new Error('Calc service unavailable — circuit breaker OPEN')
      err.status = 503
      throw err
    }

    const startMs = Date.now()
    logger.debug('calc_request', { method, path, attempt })

    try {
      const resp = await axios({
        method,
        url,
        data,
        timeout:      opts.timeout ?? 30000,
        responseType: opts.responseType ?? 'json',
        headers: {
          ...(opts.requestId ? { 'X-Request-ID': opts.requestId } : {}),
          ...(opts.headers ?? {}),
        },
      })

      cbSuccess()
      logger.info('calc_request_ok', {
        method, path, attempt,
        status:      resp.status,
        duration_ms: Date.now() - startMs,
      })
      return resp

    } catch (err) {
      const duration_ms = Date.now() - startMs
      const status      = err.response?.status
      const retryable   = isRetryable(err)

      logger.warn('calc_request_error', {
        method, path, attempt,
        status, retryable, duration_ms,
        error: err.message,
      })

      cbFailure(err)

      if (attempt > RETRY_LIMIT || !retryable) {
        const wrapped    = new Error(`Calc engine error (${status ?? 'network'}): ${err.message}`)
        wrapped.status   = status ?? 502
        wrapped.upstream = err
        throw wrapped
      }

      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      logger.info('calc_request_retry', { attempt, delay_ms: delay })
      await sleep(delay)
    }
  }
}

const calcClient = {
  get:  (path, opts)       => request('GET',  path, undefined, opts),
  post: (path, data, opts) => request('POST', path, data,      opts),

  circuitBreakerStatus: () => ({
    state:     cb.state,
    failures:  cb.failures,
    threshold: CB_FAILURE_THRESHOLD,
  }),
}

module.exports = { calcClient }