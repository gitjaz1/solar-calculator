const Bull   = require('bull')
const crypto = require('crypto')
const fs     = require('fs')
const path   = require('path')

const { calcClient } = require('./calcClient')
const email          = require('./email')
const db             = require('./db')
const logger         = require('./logger')
const { recordJob }  = require('./metrics')

const PDF_DIR   = process.env.PDF_DIR   ?? path.join(__dirname, '../../pdfs')
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

fs.mkdirSync(PDF_DIR, { recursive: true })

// ── Parse Redis URL ────────────────────────────────────────────────────
function getRedisConfig() {
  const url = new URL(REDIS_URL)
  return {
    host:     url.hostname,
    port:     parseInt(url.port, 10) || 6379,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    tls:      url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest:    null,
    enableReadyCheck:        false,
    enableOfflineQueue:      true,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  }
}

logger.info('redis_connecting', {
  host: new URL(REDIS_URL).hostname,
  port: new URL(REDIS_URL).port,
})

// ── Download token ─────────────────────────────────────────────────────
function signDownloadToken(offerRef) {
  const secret  = process.env.PDF_HMAC_SECRET
  const expires = Date.now() + 2 * 60 * 60 * 1000
  const payload = `${offerRef}:${expires}`
  const sig     = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 32)
  return `${sig}.${expires}`
}

function verifyDownloadToken(offerRef, token) {
  try {
    const [sig, expires] = token.split('.')
    if (Date.now() > parseInt(expires, 10)) return false
    const secret  = process.env.PDF_HMAC_SECRET
    const payload = `${offerRef}:${expires}`
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .slice(0, 32)
    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expected)
    )
  } catch { return false }
}

// ── DB helpers ─────────────────────────────────────────────────────────
async function dbInsertJob(jobId, meta) {
  try {
    await db.query(
      `INSERT INTO jobs
         (id, queue, status, progress, payload_meta, user_email, queued_at)
       VALUES ($1, 'offer-generation', 'queued', 0, $2, $3, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [String(jobId), JSON.stringify(meta), meta.userEmail ?? null]
    )
  } catch (err) {
    logger.warn('db_job_insert_failed', { jobId, error: err.message })
  }
}

async function dbUpdateJob(jobId, fields) {
  const sets   = []
  const values = [String(jobId)]
  let   idx    = 2
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = $${idx++}`)
    values.push(v)
  }
  if (!sets.length) return
  try {
    await db.query(
      `UPDATE jobs SET ${sets.join(', ')} WHERE id = $1`,
      values
    )
  } catch (err) {
    logger.warn('db_job_update_failed', { jobId, error: err.message })
  }
}

// ── Queue ──────────────────────────────────────────────────────────────
const offerQueue = new Bull('offer-generation', {
  redis:              getRedisConfig(),
  defaultJobOptions: {
    attempts:         3,
    backoff:          { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail:     50,
  },
})

offerQueue.on('error',   (err) => logger.error('queue_error',   { error: err.message }))
offerQueue.on('stalled', (job) => logger.warn('job_stalled',    { jobId: job.id }))
offerQueue.on('ready',   ()    => logger.info('queue_ready'))
offerQueue.on('failed',  (job, err) => logger.error('job_failed_event', { jobId: job.id, error: err.message }))

// ── Worker ─────────────────────────────────────────────────────────────
offerQueue.process(async (job) => {
  const { offerRef, user, project, zones, calcResult, userId } = job.data
  const startMs = Date.now()

  await dbInsertJob(job.id, { userEmail: user.email, offerRef })
  await job.progress(10)

  logger.info('job_started', { jobId: job.id, offerRef, email: user.email })

  try {
    await dbUpdateJob(job.id, { status: 'active', progress: 10 })
    await job.progress(20)

    const pdfResponse = await calcClient.post(
      '/pdf/generate',
      { offerRef, user, project, zones, calcResult },
      { timeout: 120000, responseType: 'arraybuffer' }
    )

    await job.progress(60)

    const pdfBuffer  = Buffer.from(pdfResponse.data)
    const filename   = `solar-offer-${offerRef}.pdf`
    const pdfPath    = path.join(PDF_DIR, filename)

    fs.writeFileSync(pdfPath, pdfBuffer)
    await dbUpdateJob(job.id, { pdf_path: pdfPath, offer_ref: offerRef })
    await job.progress(70)

    logger.info('pdf_saved', { jobId: job.id, pdfPath, size: pdfBuffer.length })

    await dbUpdateJob(job.id, { status: 'active', progress: 75 })
    await job.progress(80)

    const emailResult = await email.sendOffer({
      to:          user.email,
      contactName: user.contactName,
      companyName: user.companyName,
      projectName: project.name,
      pdfBuffer,
      filename,
    })

    if (emailResult.skipped) {
      logger.warn('email_skipped_no_smtp', { jobId: job.id })
    }

    await job.progress(90)

    const durationMs = Date.now() - startMs

    await dbUpdateJob(job.id, {
      status:       'completed',
      progress:     100,
      duration_ms:  durationMs,
      completed_at: new Date().toISOString(),
    })

    recordJob('completed', durationMs)

    logger.info('job_completed', {
      jobId:       job.id,
      offerRef,
      duration_ms: durationMs,
      emailSent:   !emailResult.skipped,
    })

    return { offerRef, filename, emailSent: !emailResult.skipped }

  } catch (err) {
    const durationMs = Date.now() - startMs

    await dbUpdateJob(job.id, {
      status:        'failed',
      error_message: err.message,
      duration_ms:   durationMs,
    })

    recordJob('failed', durationMs)

    logger.error('job_failed', {
      jobId:       job.id,
      offerRef,
      error:       err.message,
      duration_ms: durationMs,
    })

    throw err
  }
})

module.exports = { offerQueue, signDownloadToken, verifyDownloadToken }