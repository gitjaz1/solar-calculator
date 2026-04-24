const router = require('express').Router()
const crypto = require('crypto')
const path   = require('path')
const fs     = require('fs')
const logger = require('../services/logger')
const db     = require('../services/db')
const { offerQueue, signDownloadToken, verifyDownloadToken } = require('../services/queue')
const { optionalToken }    = require('../middleware/auth')
const { offerValidators, validate } = require('../middleware/validate')
const { offerLimiter }     = require('../middleware/rateLimit')

const PDF_DIR = process.env.PDF_DIR ?? path.join(__dirname, '../../pdfs')

// ── POST /offer/generate ──────────────────────────────────────────────
router.post('/generate', offerLimiter, optionalToken, offerValidators, validate, async (req, res, next) => {
  try {
    const { user, project, zones, calcResult } = req.body

    const offerRef = `SOLAR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

    const job = await offerQueue.add(
      {
        offerRef,
        user,
        project,
        zones,
        calcResult,
        userId: req.user?.userId ?? null,
      },
      {
        attempts: 3,
        backoff:  { type: 'exponential', delay: 5000 },
      }
    )

    logger.info('offer_queued', {
      jobId:    job.id,
      offerRef,
      email:    user.email,
      userId:   req.user?.userId ?? 'guest',
    })

    res.json({ jobId: job.id, offerRef })
  } catch (err) { next(err) }
})

// ── GET /offer/status/:jobId ──────────────────────────────────────────
router.get('/status/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params
    const job = await offerQueue.getJob(jobId)

    if (!job) {
      const dbJob = await db.query(
        'SELECT * FROM jobs WHERE id = $1',
        [String(jobId)]
      )
      if (!dbJob.rows.length) {
        return res.status(404).json({ message: 'Job not found' })
      }
      const row = dbJob.rows[0]
      return res.json({
        jobId,
        status:   row.status,
        progress: 100,
        result:   row.status === 'completed' ? {
          offerRef:      row.offer_ref,
          downloadToken: signDownloadToken(row.offer_ref),
          filename:      `solar-offer-${row.offer_ref}.pdf`,
        } : null,
        error: row.error_message ?? null,
      })
    }

    const state    = await job.getState()
    const progress = job._progress ?? 0
    const failed   = state === 'failed'
    const done     = state === 'completed'

    res.json({
      jobId,
      status:   state,
      progress: done ? 100 : progress,
      result:   done ? {
        offerRef:      job.returnvalue?.offerRef,
        downloadToken: signDownloadToken(job.returnvalue?.offerRef),
        filename:      `solar-offer-${job.returnvalue?.offerRef}.pdf`,
      } : null,
      error: failed ? (job.failedReason ?? 'Unknown error') : null,
    })
  } catch (err) { next(err) }
})

// ── GET /offer/download/:offerRef ─────────────────────────────────────
router.get('/download/:offerRef', async (req, res, next) => {
  try {
    const { offerRef } = req.params
    const { token }    = req.query

    if (!token || !verifyDownloadToken(offerRef, token)) {
      return res.status(403).json({ message: 'Invalid or expired download token' })
    }

    const dbJob = await db.query(
      'SELECT pdf_path FROM jobs WHERE offer_ref = $1 AND status = $2',
      [offerRef, 'completed']
    )

    if (!dbJob.rows.length || !dbJob.rows[0].pdf_path) {
      return res.status(404).json({ message: 'PDF not found' })
    }

    const pdfPath = dbJob.rows[0].pdf_path

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file no longer available' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="solar-offer-${offerRef}.pdf"`)
    fs.createReadStream(pdfPath).pipe(res)
  } catch (err) { next(err) }
})

module.exports = router